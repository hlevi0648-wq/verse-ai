// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Treasury is AccessControl, ReentrancyGuard {
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant STRATEGY_ROLE = keccak256("STRATEGY_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    mapping(address => uint256) public tokenBalances;
    mapping(address => bool) public approvedTokens;
    mapping(address => uint256) public strategyAllocations;
    mapping(address => uint256) public strategyLimits;

    uint256 public totalAllocated;
    uint256 public constant MAX_ALLOCATION_PERCENT = 50;

    event TokenDeposited(address indexed token, uint256 amount, address depositor);
    event TokenWithdrawn(address indexed token, uint256 amount, address recipient);
    event StrategyAllocated(address indexed strategy, uint256 amount);
    event StrategyDeallocated(address indexed strategy, uint256 amount);
    event StrategyLimitUpdated(address indexed strategy, uint256 newLimit);
    event TokenApproved(address indexed token);
    event TokenRevoked(address indexed token);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TREASURER_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);
    }

    function depositToken(address token, uint256 amount)
        external
        nonReentrant
        onlyRole(TREASURER_ROLE)
    {
        require(approvedTokens[token], "Token not approved");
        require(amount > 0, "Invalid amount");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        tokenBalances[token] += amount;

        emit TokenDeposited(token, amount, msg.sender);
    }

    function withdrawToken(address token, uint256 amount, address recipient)
        external
        nonReentrant
        onlyRole(TREASURER_ROLE)
    {
        require(tokenBalances[token] >= amount, "Insufficient balance");
        require(recipient != address(0), "Invalid recipient");

        tokenBalances[token] -= amount;
        IERC20(token).transfer(recipient, amount);

        emit TokenWithdrawn(token, amount, recipient);
    }

    function allocateToStrategy(address strategy, uint256 amount)
        external
        nonReentrant
        onlyRole(GOVERNANCE_ROLE)
    {
        require(amount > 0, "Invalid amount");
        require(strategyAllocations[strategy] + amount <= strategyLimits[strategy], "Exceeds strategy limit");

        strategyAllocations[strategy] += amount;
        totalAllocated += amount;

        emit StrategyAllocated(strategy, amount);
    }

    function deallocateFromStrategy(address strategy, uint256 amount)
        external
        nonReentrant
        onlyRole(GOVERNANCE_ROLE)
    {
        require(strategyAllocations[strategy] >= amount, "Insufficient allocation");

        strategyAllocations[strategy] -= amount;
        totalAllocated -= amount;

        emit StrategyDeallocated(strategy, amount);
    }

    function setStrategyLimit(address strategy, uint256 limitAmount)
        external
        onlyRole(GOVERNANCE_ROLE)
    {
        require(limitAmount > 0, "Invalid limit");
        strategyLimits[strategy] = limitAmount;
        emit StrategyLimitUpdated(strategy, limitAmount);
    }

    function approveToken(address token) external onlyRole(GOVERNANCE_ROLE) {
        approvedTokens[token] = true;
        emit TokenApproved(token);
    }

    function revokeToken(address token) external onlyRole(GOVERNANCE_ROLE) {
        approvedTokens[token] = false;
        emit TokenRevoked(token);
    }
}