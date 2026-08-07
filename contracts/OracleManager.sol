// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

contract OracleManager is AccessControl {
    bytes32 public constant ORACLE_ADMIN_ROLE = keccak256("ORACLE_ADMIN_ROLE");

    struct PriceFeed {
        address feedAddress;
        uint256 stalePriceDelay;
        bool isActive;
    }

    mapping(bytes32 => PriceFeed) public priceFeeds;
    mapping(bytes32 => bytes32) public reversePairHash;
    uint256 public constant DEFAULT_STALE_DELAY = 1 hours;

    event PriceFeedAdded(
        bytes32 indexed pairHash,
        address feedAddress,
        uint256 staleDelay
    );
    event PriceFeedUpdated(
        bytes32 indexed pairHash,
        address newFeed,
        uint256 newStaleDelay
    );
    event PriceFeedDeactivated(bytes32 indexed pairHash);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ADMIN_ROLE, admin);
    }

    function addPriceFeed(
        address token0,
        address token1,
        address feedAddress,
        uint256 staleDelay
    ) external onlyRole(ORACLE_ADMIN_ROLE) {
        require(feedAddress != address(0), "Invalid feed address");
        bytes32 pairHash = keccak256(abi.encodePacked(token0, token1));
        bytes32 reverseHash = keccak256(abi.encodePacked(token1, token0));

        priceFeeds[pairHash] = PriceFeed({
            feedAddress: feedAddress,
            stalePriceDelay: staleDelay > 0 ? staleDelay : DEFAULT_STALE_DELAY,
            isActive: true
        });

        priceFeeds[reverseHash] = PriceFeed({
            feedAddress: feedAddress,
            stalePriceDelay: staleDelay > 0 ? staleDelay : DEFAULT_STALE_DELAY,
            isActive: true
        });

        reversePairHash[pairHash] = reverseHash;
        reversePairHash[reverseHash] = pairHash;

        emit PriceFeedAdded(pairHash, feedAddress, staleDelay);
    }

    function getPrice(address token0, address token1)
        external
        view
        returns (uint256 price, uint256 timestamp, bool isStale)
    {
        bytes32 pairHash = keccak256(abi.encodePacked(token0, token1));
        PriceFeed memory feed = priceFeeds[pairHash];

        require(feed.feedAddress != address(0), "Price feed not found");
        require(feed.isActive, "Price feed inactive");

        AggregatorV3Interface aggregator = AggregatorV3Interface(feed.feedAddress);
        (, int256 answer, , uint256 updatedAt, ) = aggregator.latestRoundData();

        require(answer > 0, "Invalid price");

        uint256 currentTime = block.timestamp;
        bool stale = (currentTime - updatedAt) > feed.stalePriceDelay;

        return (uint256(answer), updatedAt, stale);
    }

    function deactivatePriceFeed(address token0, address token1)
        external
        onlyRole(ORACLE_ADMIN_ROLE)
    {
        bytes32 pairHash = keccak256(abi.encodePacked(token0, token1));
        require(priceFeeds[pairHash].feedAddress != address(0), "Price feed not found");

        priceFeeds[pairHash].isActive = false;

        bytes32 reverseHash = reversePairHash[pairHash];
        if (reverseHash != bytes32(0)) {
            priceFeeds[reverseHash].isActive = false;
        }

        emit PriceFeedDeactivated(pairHash);
    }
}
