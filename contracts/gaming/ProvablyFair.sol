// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ProvablyFair is Ownable(msg.sender) {
    mapping(address => bytes32) public playerCommitments;
    mapping(address => bytes32) public revealedSeeds;
    uint256 public nonce;
    
    event Committed(address indexed player, bytes32 commitment, uint256 nonce);
    event Revealed(address indexed player, bytes32 seed, uint256 result);
    
    function commit(bytes32 commitment) external {
        require(commitment != bytes32(0), "Invalid commitment");
        playerCommitments[msg.sender] = commitment;
        emit Committed(msg.sender, commitment, nonce++);
    }
    
    function reveal(address player, bytes32 seed) external onlyOwner {
        bytes32 expectedCommitment = keccak256(abi.encodePacked(seed, player));
        require(playerCommitments[player] == expectedCommitment, "Invalid reveal");
        revealedSeeds[player] = seed;
        uint256 result = uint256(keccak256(abi.encodePacked(seed, player, block.timestamp)));
        emit Revealed(player, seed, result);
    }
    
    function verify(address player, bytes32 seed) external view returns (bool) {
        bytes32 expectedCommitment = keccak256(abi.encodePacked(seed, player));
        return playerCommitments[player] == expectedCommitment;
    }
}