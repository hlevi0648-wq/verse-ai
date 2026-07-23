// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IStakingVault {
    function totalStaked() external view returns (uint256);
    function stakedBalance(address user) external view returns (uint256);
}

contract RewardDistributor is Ownable, ReentrancyGuard {
    IERC20 public immutable rewardToken;
    IStakingVault public immutable stakingVault;

    uint256 public accRewardPerToken;
    uint256 private constant PRECISION = 1e18;
    uint256 public totalRewardsDistributed;

    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public rewardsClaimed;

    event RewardsDeposited(uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);

    constructor(
        address rewardToken_,
        address stakingVault_,
        address initialOwner
    ) Ownable(initialOwner) {
        rewardToken = IERC20(rewardToken_);
        stakingVault = IStakingVault(stakingVault_);
    }

    function depositRewards(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Invalid amount");

        rewardToken.transferFrom(msg.sender, address(this), amount);

        uint256 total = stakingVault.totalStaked();
        require(total > 0, "No stakers");

        accRewardPerToken += (amount * PRECISION) / total;
        totalRewardsDistributed += amount;

        emit RewardsDeposited(amount, block.timestamp);
    }

    function pendingRewards(address user) public view returns (uint256) {
        uint256 stake = stakingVault.stakedBalance(user);
        if (stake == 0) return 0;

        uint256 accumulated = (stake * accRewardPerToken) / PRECISION;

        if (accumulated <= rewardDebt[user]) {
            return 0;
        }

        return accumulated - rewardDebt[user];
    }

    function claim() external nonReentrant {
        uint256 reward = pendingRewards(msg.sender);
        require(reward > 0, "No rewards");

        uint256 stake = stakingVault.stakedBalance(msg.sender);
        rewardDebt[msg.sender] = (stake * accRewardPerToken) / PRECISION;
        rewardsClaimed[msg.sender] += reward;

        rewardToken.transfer(msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward, block.timestamp);
    }

    function getRewardStats(address user)
        external
        view
        returns (
            uint256 pending,
            uint256 claimed,
            uint256 totalDistributed
        )
    {
        return (pendingRewards(user), rewardsClaimed[user], totalRewardsDistributed);
    }
}