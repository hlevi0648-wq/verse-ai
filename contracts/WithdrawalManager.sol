// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract WithdrawalManager is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");

    struct WithdrawalRequest {
        address user;
        address token;
        uint256 amount;
        uint256 fee;
        uint256 requestedAt;
        WithdrawalStatus status;
        string fiatCurrency;
        string paymentMethod;
    }

    enum WithdrawalStatus {
        Pending,
        Processing,
        Completed,
        Cancelled,
        Rejected
    }

    IERC20 public verseToken;
    uint256 public withdrawalFeeBps = 50;
    uint256 public minWithdrawal = 100 * 10**18;
    uint256 public maxDailyWithdrawal = 1000000 * 10**18;
    uint256 public dailyWithdrawn;
    uint256 public lastResetDay;

    mapping(uint256 => WithdrawalRequest) public requests;
    uint256 public requestCount;

    mapping(address => uint256) public userPendingAmount;

    event WithdrawalRequested(uint256 indexed requestId, address indexed user, address token, uint256 amount, uint256 fee, string fiatCurrency);
    event WithdrawalProcessing(uint256 indexed requestId);
    event WithdrawalCompleted(uint256 indexed requestId, string txHash);
    event WithdrawalCancelled(uint256 indexed requestId);
    event WithdrawalRejected(uint256 indexed requestId, string reason);
    event FeeUpdated(uint256 newFeeBps);
    event LimitsUpdated(uint256 minWithdrawal, uint256 maxDailyWithdrawal);

    constructor(address _verseToken, address admin) {
        verseToken = IERC20(_verseToken);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(PROCESSOR_ROLE, admin);
    }

    function requestWithdrawal(
        uint256 amount,
        string calldata fiatCurrency,
        string calldata paymentMethod
    ) external nonReentrant returns (uint256) {
        require(amount >= minWithdrawal, "Below minimum withdrawal");
        _resetDailyIfNeeded();

        uint256 fee = (amount * withdrawalFeeBps) / 10000;
        uint256 totalRequired = amount + fee;

        require(verseToken.balanceOf(msg.sender) >= totalRequired, "Insufficient balance");
        require(dailyWithdrawn + amount <= maxDailyWithdrawal, "Daily limit exceeded");

        uint256 requestId = requestCount++;

        requests[requestId] = WithdrawalRequest({
            user: msg.sender,
            token: address(verseToken),
            amount: amount,
            fee: fee,
            requestedAt: block.timestamp,
            status: WithdrawalStatus.Pending,
            fiatCurrency: fiatCurrency,
            paymentMethod: paymentMethod
        });

        userPendingAmount[msg.sender] += totalRequired;
        dailyWithdrawn += amount;

        require(verseToken.transferFrom(msg.sender, address(this), totalRequired), "Transfer failed");

        emit WithdrawalRequested(requestId, msg.sender, address(verseToken), amount, fee, fiatCurrency);
        return requestId;
    }

    function processWithdrawal(uint256 requestId) external onlyRole(PROCESSOR_ROLE) {
        WithdrawalRequest storage req = requests[requestId];
        require(req.status == WithdrawalStatus.Pending, "Not pending");

        req.status = WithdrawalStatus.Processing;
        userPendingAmount[req.user] -= (req.amount + req.fee);

        emit WithdrawalProcessing(requestId);
    }

    function completeWithdrawal(uint256 requestId, string calldata moonpayTxId) external onlyRole(PROCESSOR_ROLE) {
        WithdrawalRequest storage req = requests[requestId];
        require(req.status == WithdrawalStatus.Processing, "Not processing");

        req.status = WithdrawalStatus.Completed;

        require(verseToken.transfer(msg.sender, req.amount), "Principal transfer failed");

        emit WithdrawalCompleted(requestId, moonpayTxId);
    }

    function cancelWithdrawal(uint256 requestId) external nonReentrant {
        WithdrawalRequest storage req = requests[requestId];
        require(req.user == msg.sender, "Not your request");
        require(req.status == WithdrawalStatus.Pending, "Cannot cancel");

        req.status = WithdrawalStatus.Cancelled;
        uint256 refund = req.amount + req.fee;
        userPendingAmount[req.user] -= refund;
        dailyWithdrawn -= req.amount;

        require(verseToken.transfer(msg.sender, refund), "Refund failed");

        emit WithdrawalCancelled(requestId);
    }

    function rejectWithdrawal(uint256 requestId, string calldata reason) external onlyRole(PROCESSOR_ROLE) nonReentrant {
        WithdrawalRequest storage req = requests[requestId];
        require(req.status == WithdrawalStatus.Pending || req.status == WithdrawalStatus.Processing, "Cannot reject");

        req.status = WithdrawalStatus.Rejected;
        uint256 refund = req.amount + req.fee;
        userPendingAmount[req.user] -= refund;

        require(verseToken.transfer(req.user, refund), "Refund failed");

        emit WithdrawalRejected(requestId, reason);
    }

    function setFee(uint256 newFeeBps) external onlyRole(ADMIN_ROLE) {
        require(newFeeBps <= 500, "Fee too high");
        withdrawalFeeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    function setLimits(uint256 _minWithdrawal, uint256 _maxDailyWithdrawal) external onlyRole(ADMIN_ROLE) {
        minWithdrawal = _minWithdrawal;
        maxDailyWithdrawal = _maxDailyWithdrawal;
        emit LimitsUpdated(_minWithdrawal, _maxDailyWithdrawal);
    }

    function getPendingRequests(uint256 offset, uint256 limit) external view returns (WithdrawalRequest[] memory) {
        uint256 total = 0;
        for (uint256 i = offset; i < requestCount && i < offset + limit; i++) {
            if (requests[i].status == WithdrawalStatus.Pending) total++;
        }
        WithdrawalRequest[] memory result = new WithdrawalRequest[](total);
        uint256 idx = 0;
        for (uint256 i = offset; i < requestCount && i < offset + limit; i++) {
            if (requests[i].status == WithdrawalStatus.Pending) {
                result[idx++] = requests[i];
            }
        }
        return result;
    }

    function _resetDailyIfNeeded() internal {
        uint256 today = block.timestamp / 1 days;
        if (today != lastResetDay) {
            dailyWithdrawn = 0;
            lastResetDay = today;
        }
    }
}