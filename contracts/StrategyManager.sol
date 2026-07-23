// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

struct Strategy {
    address strategyAddress;
    string name;
    string description;
    bool isActive;
    uint256 maxAllocation;
    uint256 currentAllocation;
    uint256 apy;
    uint256 riskScore;
    address yieldToken;
}

contract StrategyManager is AccessControl, ReentrancyGuard {
    bytes32 public constant STRATEGY_ADMIN_ROLE = keccak256("STRATEGY_ADMIN_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    mapping(address => Strategy) public strategies;
    address[] public strategyList;
    mapping(address => bool) public strategyExists;

    event StrategyAdded(
        address indexed strategy,
        string name,
        uint256 maxAllocation,
        uint256 apy
    );
    event StrategyUpdated(
        address indexed strategy,
        uint256 newApy,
        uint256 newRiskScore
    );
    event StrategyDeactivated(address indexed strategy);
    event StrategyReactivated(address indexed strategy);
    event AllocationUpdated(
        address indexed strategy,
        uint256 newAllocation
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(STRATEGY_ADMIN_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
    }

    function addStrategy(
        address strategyAddress,
        string memory name,
        string memory description,
        uint256 maxAllocation,
        uint256 apy,
        uint256 riskScore,
        address yieldToken
    ) external onlyRole(STRATEGY_ADMIN_ROLE) {
        require(strategyAddress != address(0), "Invalid strategy address");
        require(!strategyExists[strategyAddress], "Strategy already exists");
        require(apy <= 10000, "APY cannot exceed 100%");
        require(riskScore <= 100, "Risk score must be <= 100");

        strategies[strategyAddress] = Strategy({
            strategyAddress: strategyAddress,
            name: name,
            description: description,
            isActive: true,
            maxAllocation: maxAllocation,
            currentAllocation: 0,
            apy: apy,
            riskScore: riskScore,
            yieldToken: yieldToken
        });

        strategyList.push(strategyAddress);
        strategyExists[strategyAddress] = true;

        emit StrategyAdded(strategyAddress, name, maxAllocation, apy);
    }

    function updateStrategy(
        address strategyAddress,
        uint256 newApy,
        uint256 newRiskScore
    ) external onlyRole(STRATEGY_ADMIN_ROLE) {
        require(strategyExists[strategyAddress], "Strategy not found");
        require(newApy <= 10000, "APY cannot exceed 100%");
        require(newRiskScore <= 100, "Risk score must be <= 100");

        strategies[strategyAddress].apy = newApy;
        strategies[strategyAddress].riskScore = newRiskScore;

        emit StrategyUpdated(strategyAddress, newApy, newRiskScore);
    }

    function deactivateStrategy(address strategyAddress)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        require(strategyExists[strategyAddress], "Strategy not found");
        strategies[strategyAddress].isActive = false;
        emit StrategyDeactivated(strategyAddress);
    }

    function reactivateStrategy(address strategyAddress)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        require(strategyExists[strategyAddress], "Strategy not found");
        strategies[strategyAddress].isActive = true;
        emit StrategyReactivated(strategyAddress);
    }

    function updateAllocation(
        address strategyAddress,
        uint256 newAllocation
    ) external onlyRole(GOVERNANCE_ROLE) {
        require(strategyExists[strategyAddress], "Strategy not found");
        require(
            newAllocation <= strategies[strategyAddress].maxAllocation,
            "Exceeds max allocation"
        );

        strategies[strategyAddress].currentAllocation = newAllocation;
        emit AllocationUpdated(strategyAddress, newAllocation);
    }

    function getStrategy(address strategyAddress)
        external
        view
        returns (Strategy memory)
    {
        require(strategyExists[strategyAddress], "Strategy not found");
        return strategies[strategyAddress];
    }

    function getAllStrategies() external view returns (Strategy[] memory) {
        Strategy[] memory all = new Strategy[](strategyList.length);
        for (uint256 i = 0; i < strategyList.length; i++) {
            all[i] = strategies[strategyList[i]];
        }
        return all;
    }
}