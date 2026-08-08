// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SweepstakesVault is Ownable, ReentrancyGuard, Pausable {
    IERC20 public verseToken;
    
    struct Sweepstake {
        uint256 id;
        uint256 entryFee;
        uint256 prizePool;
        uint256 maxEntries;
        uint256 entryCount;
        uint256 startTime;
        uint256 endTime;
        bool drawn;
        uint256 winnerId;
        address winner;
        uint256 treasuryBps;
    }
    
    struct Entry {
        uint256 sweepstakeId;
        address player;
        uint256 timestamp;
        bytes32 commitment;
    }
    
    mapping(uint256 => Sweepstake) public sweepstakes;
    mapping(uint256 => Entry[]) public entries;
    uint256 public sweepstakeCount;
    uint256 public totalPrizeDistributed;
    uint256 public totalTreasuryFees;
    address public treasury;
    
    event SweepstakeCreated(uint256 indexed id, uint256 entryFee, uint256 maxEntries, uint256 startTime, uint256 endTime);
    event EntryPlaced(uint256 indexed sweepstakeId, address indexed player, uint256 entryIndex);
    event SweepstakeDrawn(uint256 indexed sweepstakeId, address indexed winner, uint256 prize);
    event PrizeClaimed(uint256 indexed sweepstakeId, address indexed winner, uint256 amount);
    
    constructor(address _verseToken, address _treasury) Ownable(msg.sender) {
        verseToken = IERC20(_verseToken);
        treasury = _treasury;
    }
    
    function createSweepstake(uint256 entryFee, uint256 maxEntries, uint256 startTime, uint256 endTime, uint256 treasuryBps) external onlyOwner returns (uint256) {
        require(endTime > startTime, "End must be after start");
        require(treasuryBps <= 2000, "Treasury cut max 20%");
        uint256 id = sweepstakeCount++;
        sweepstakes[id] = Sweepstake(id, entryFee, 0, maxEntries, 0, startTime, endTime, false, 0, address(0), treasuryBps);
        emit SweepstakeCreated(id, entryFee, maxEntries, startTime, endTime);
        return id;
    }
    
    function enter(uint256 sweepstakeId, bytes32 commitment) external whenNotPaused nonReentrant {
        Sweepstake storage s = sweepstakes[sweepstakeId];
        require(block.timestamp >= s.startTime, "Not yet open");
        require(block.timestamp <= s.endTime, "Entries closed");
        require(!s.drawn, "Already drawn");
        require(s.maxEntries == 0 || s.entryCount < s.maxEntries, "Max entries reached");
        uint256 fee = s.entryFee;
        require(verseToken.transferFrom(msg.sender, address(this), fee), "Transfer failed");
        uint256 treasuryCut = (fee * s.treasuryBps) / 10000;
        uint256 poolAddition = fee - treasuryCut;
        s.prizePool += poolAddition;
        totalTreasuryFees += treasuryCut;
        entries[sweepstakeId].push(Entry(sweepstakeId, msg.sender, block.timestamp, commitment));
        s.entryCount++;
        emit EntryPlaced(sweepstakeId, msg.sender, entries[sweepstakeId].length - 1);
    }
    
    function draw(uint256 sweepstakeId, uint256 seed) external onlyOwner nonReentrant {
        Sweepstake storage s = sweepstakes[sweepstakeId];
        require(block.timestamp > s.endTime, "Not yet ended");
        require(!s.drawn, "Already drawn");
        require(s.entryCount > 0, "No entries");
        uint256 winnerIndex = uint256(keccak256(abi.encodePacked(seed, block.timestamp, sweepstakeId))) % s.entryCount;
        s.drawn = true;
        s.winnerId = winnerIndex;
        s.winner = entries[sweepstakeId][winnerIndex].player;
        emit SweepstakeDrawn(sweepstakeId, s.winner, s.prizePool);
    }
    
    function claimPrize(uint256 sweepstakeId) external nonReentrant {
        Sweepstake storage s = sweepstakes[sweepstakeId];
        require(s.drawn, "Not yet drawn");
        require(s.winner == msg.sender, "Not the winner");
        require(s.prizePool > 0, "Already claimed");
        uint256 prize = s.prizePool;
        s.prizePool = 0;
        totalPrizeDistributed += prize;
        require(verseToken.transfer(msg.sender, prize), "Transfer failed");
        emit PrizeClaimed(sweepstakeId, msg.sender, prize);
    }
    
    function withdrawTreasuryFees() external {
        require(msg.sender == treasury || msg.sender == owner(), "Not treasury");
        uint256 balance = verseToken.balanceOf(address(this));
        uint256 activePools = 0;
        for (uint256 i = 0; i < sweepstakeCount; i++) {
            activePools += sweepstakes[i].prizePool;
        }
        uint256 available = balance - activePools;
        require(available > 0, "Nothing to withdraw");
        require(verseToken.transfer(treasury, available), "Transfer failed");
    }
    
    function getEntries(uint256 sweepstakeId) external view returns (Entry[] memory) {
        return entries[sweepstakeId];
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}