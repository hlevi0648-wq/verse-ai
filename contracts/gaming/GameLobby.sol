// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GameLobby is Ownable, ReentrancyGuard, Pausable {
    IERC20 public verseToken;
    address public treasury;
    uint256 public treasuryBps;
    
    struct GameRoom {
        uint256 id;
        string gameType;
        uint256 buyIn;
        uint256 maxPlayers;
        uint256 activePlayers;
        bool active;
    }
    
    struct GameSession {
        uint256 roomId;
        address player;
        uint256 startTime;
        uint256 score;
        bool completed;
        uint256 payout;
    }
    
    mapping(uint256 => GameRoom) public rooms;
    mapping(address => uint256) public activeRoom;
    mapping(bytes32 => GameSession) public sessions;
    uint256 public roomCount;
    mapping(string => mapping(address => uint256)) public highScores;
    uint256 public totalVolume;
    
    event RoomCreated(uint256 indexed id, string gameType, uint256 buyIn, uint256 maxPlayers);
    event PlayerJoined(uint256 indexed roomId, address indexed player);
    event GameStarted(uint256 indexed roomId, address indexed player, bytes32 sessionHash);
    event GameEnded(uint256 indexed roomId, address indexed player, uint256 score, uint256 payout);
    event PlayerLeft(uint256 indexed roomId, address indexed player);
    
    constructor(address _verseToken, address _treasury, uint256 _treasuryBps) Ownable(msg.sender) {
        verseToken = IERC20(_verseToken);
        treasury = _treasury;
        treasuryBps = _treasuryBps;
    }
    
    function createRoom(string calldata gameType, uint256 buyIn, uint256 maxPlayers) external onlyOwner returns (uint256) {
        uint256 id = roomCount++;
        rooms[id] = GameRoom(id, gameType, buyIn, maxPlayers, 0, true);
        emit RoomCreated(id, gameType, buyIn, maxPlayers);
        return id;
    }
    
    function joinRoom(uint256 roomId) external whenNotPaused nonReentrant {
        GameRoom storage room = rooms[roomId];
        require(room.active, "Room not active");
        require(room.activePlayers < room.maxPlayers, "Room full");
        require(activeRoom[msg.sender] == 0, "Already in a room");
        require(verseToken.transferFrom(msg.sender, address(this), room.buyIn), "Buy-in failed");
        room.activePlayers++;
        activeRoom[msg.sender] = roomId + 1;
        totalVolume += room.buyIn;
        emit PlayerJoined(roomId, msg.sender);
    }
    
    function startGame(uint256 roomId) external whenNotPaused returns (bytes32) {
        require(activeRoom[msg.sender] == roomId + 1, "Not in this room");
        bytes32 sessionHash = keccak256(abi.encodePacked(msg.sender, roomId, block.timestamp));
        sessions[sessionHash] = GameSession(roomId, msg.sender, block.timestamp, 0, false, 0);
        emit GameStarted(roomId, msg.sender, sessionHash);
        return sessionHash;
    }
    
    function endGame(bytes32 sessionHash, uint256 score) external nonReentrant {
        GameSession storage session = sessions[sessionHash];
        require(session.player == msg.sender, "Not your session");
        require(!session.completed, "Already completed");
        GameRoom storage room = rooms[session.roomId];
        session.score = score;
        session.completed = true;
        uint256 maxPayout = room.buyIn * 10;
        uint256 rawPayout = (room.buyIn * score) / 10000;
        if (rawPayout > maxPayout) rawPayout = maxPayout;
        uint256 treasuryCut = (rawPayout * treasuryBps) / 10000;
        uint256 playerPayout = rawPayout - treasuryCut;
        session.payout = playerPayout;
        if (playerPayout > 0) {
            require(verseToken.transfer(msg.sender, playerPayout), "Payout failed");
        }
        if (score > highScores[room.gameType][msg.sender]) {
            highScores[room.gameType][msg.sender] = score;
        }
        room.activePlayers--;
        activeRoom[msg.sender] = 0;
        emit GameEnded(session.roomId, msg.sender, score, playerPayout);
        emit PlayerLeft(session.roomId, msg.sender);
    }
    
    function leaveRoom(uint256 roomId) external nonReentrant {
        require(activeRoom[msg.sender] == roomId + 1, "Not in this room");
        GameRoom storage room = rooms[roomId];
        uint256 refund = room.buyIn / 2;
        if (refund > 0) {
            require(verseToken.transfer(msg.sender, refund), "Refund failed");
        }
        room.activePlayers--;
        activeRoom[msg.sender] = 0;
        emit PlayerLeft(roomId, msg.sender);
    }
    
    function getHighScore(string calldata gameType, address player) external view returns (uint256) {
        return highScores[gameType][player];
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}