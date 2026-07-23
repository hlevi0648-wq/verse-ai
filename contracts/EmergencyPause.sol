// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract EmergencyPause is AccessControl, Pausable {
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    event EmergencyPauseTriggered(address indexed pauser, uint256 timestamp);
    event EmergencyUnpauseTriggered(address indexed unpauser, uint256 timestamp);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(EMERGENCY_ROLE, admin);
    }

    function triggerEmergencyPause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
        emit EmergencyPauseTriggered(msg.sender, block.timestamp);
    }

    function triggerEmergencyUnpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
        emit EmergencyUnpauseTriggered(msg.sender, block.timestamp);
    }

    function isPaused() external view returns (bool) {
        return paused();
    }
}