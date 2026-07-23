// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract StakingVault is Ownable, ReentrancyGuard, Pausable {
    IERC20 public immutable verse;

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public lastStakeTime;
    uint256 public totalStaked;
    uint256 public constant UNBOND_PERIOD = 7 days;

    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event UnstakeRequested(address indexed user, uint256 amount, uint256 requestTime);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);

    constructor(address verseToken, address initialOwner)
        Ownable(initialOwner)
    {
        verse = IERC20(verseToken);
    }

    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Invalid amount");

        verse.transferFrom(msg.sender, address(this), amount);

        stakedBalance[msg.sender] += amount;
        totalStaked += amount;
        lastStakeTime[msg.sender] = block.timestamp;

        emit Staked(msg.sender, amount, block.timestamp);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");
        require(stakedBalance[msg.sender] >= amount, "Insufficient stake");
        require(
            block.timestamp >= lastStakeTime[msg.sender] + UNBOND_PERIOD,
            "Still in unbond period"
        );

        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        verse.transfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount, block.timestamp);
    }

    function balanceOf(address user) external view returns (uint256) {
        return stakedBalance[user];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}