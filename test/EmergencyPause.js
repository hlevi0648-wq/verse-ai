const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EmergencyPause", function () {
  let emergencyPause, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const EmergencyPause = await ethers.getContractFactory("EmergencyPause");
    emergencyPause = await EmergencyPause.deploy(owner.address);
    await emergencyPause.waitForDeployment();
  });

  it("should start unpaused", async function () {
    expect(await emergencyPause.isPaused()).to.be.false;
  });

  it("should allow emergency role to pause", async function () {
    await emergencyPause.triggerEmergencyPause();
    expect(await emergencyPause.isPaused()).to.be.true;
  });

  it("should emit EmergencyPauseTriggered event", async function () {
    await expect(emergencyPause.triggerEmergencyPause())
      .to.emit(emergencyPause, "EmergencyPauseTriggered")
      .withArgs(owner.address, (v) => v > 0n);
  });

  it("should allow emergency role to unpause", async function () {
    await emergencyPause.triggerEmergencyPause();
    await emergencyPause.triggerEmergencyUnpause();
    expect(await emergencyPause.isPaused()).to.be.false;
  });

  it("should emit EmergencyUnpauseTriggered event", async function () {
    await emergencyPause.triggerEmergencyPause();
    await expect(emergencyPause.triggerEmergencyUnpause())
      .to.emit(emergencyPause, "EmergencyUnpauseTriggered")
      .withArgs(owner.address, (v) => v > 0n);
  });

  it("should revert pause from non-emergency role", async function () {
    await expect(
      emergencyPause.connect(addr1).triggerEmergencyPause()
    ).to.be.revertedWithCustomError(emergencyPause, "AccessControlUnauthorizedAccount");
  });

  it("should revert unpause from non-emergency role", async function () {
    await emergencyPause.triggerEmergencyPause();
    await expect(
      emergencyPause.connect(addr1).triggerEmergencyUnpause()
    ).to.be.revertedWithCustomError(emergencyPause, "AccessControlUnauthorizedAccount");
  });

  it("should revert double pause", async function () {
    await emergencyPause.triggerEmergencyPause();
    await expect(
      emergencyPause.triggerEmergencyPause()
    ).to.be.revertedWithCustomError(emergencyPause, "EnforcedPause");
  });

  it("should revert unpause when not paused", async function () {
    await expect(
      emergencyPause.triggerEmergencyUnpause()
    ).to.be.revertedWithCustomError(emergencyPause, "ExpectedPause");
  });
});
