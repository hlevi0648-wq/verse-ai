const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StrategyManager", function () {
  let strategyManager, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    strategyManager = await StrategyManager.deploy(owner.address);
    await strategyManager.waitForDeployment();
  });

  it("should allow admin to add a strategy", async function () {
    await strategyManager.addStrategy(
      addr1.address, "Aave", "Lending protocol", ethers.parseUnits("1000", 18), 500, 30, addr2.address
    );
    const strategy = await strategyManager.getStrategy(addr1.address);
    expect(strategy.name).to.equal("Aave");
    expect(strategy.isActive).to.be.true;
    expect(strategy.apy).to.equal(500);
    expect(strategy.riskScore).to.equal(30);
  });

  it("should emit StrategyAdded event", async function () {
    await expect(
      strategyManager.addStrategy(
        addr1.address, "Aave", "Lending", ethers.parseUnits("1000", 18), 500, 30, addr2.address
      )
    ).to.emit(strategyManager, "StrategyAdded").withArgs(addr1.address, "Aave", ethers.parseUnits("1000", 18), 500);
  });

  it("should revert adding strategy with zero address", async function () {
    await expect(
      strategyManager.addStrategy(ethers.ZeroAddress, "Bad", "Invalid", 1000, 500, 30, addr2.address)
    ).to.be.revertedWith("Invalid strategy address");
  });

  it("should revert adding duplicate strategy", async function () {
    await strategyManager.addStrategy(addr1.address, "Aave", "Lending", 1000, 500, 30, addr2.address);
    await expect(
      strategyManager.addStrategy(addr1.address, "Aave2", "Lending2", 1000, 500, 30, addr2.address)
    ).to.be.revertedWith("Strategy already exists");
  });

  it("should revert APY exceeding 100%", async function () {
    await expect(
      strategyManager.addStrategy(addr1.address, "Bad", "Invalid", 1000, 10001, 30, addr2.address)
    ).to.be.revertedWith("APY cannot exceed 100%");
  });

  it("should revert risk score exceeding 100", async function () {
    await expect(
      strategyManager.addStrategy(addr1.address, "Bad", "Invalid", 1000, 500, 101, addr2.address)
    ).to.be.revertedWith("Risk score must be <= 100");
  });

  it("should allow admin to update strategy", async function () {
    await strategyManager.addStrategy(addr1.address, "Aave", "Lending", 1000, 500, 30, addr2.address);
    await strategyManager.updateStrategy(addr1.address, 600, 40);
    const strategy = await strategyManager.getStrategy(addr1.address);
    expect(strategy.apy).to.equal(600);
    expect(strategy.riskScore).to.equal(40);
  });

  it("should allow governance to deactivate strategy", async function () {
    await strategyManager.addStrategy(addr1.address, "Aave", "Lending", 1000, 500, 30, addr2.address);
    await strategyManager.deactivateStrategy(addr1.address);
    const strategy = await strategyManager.getStrategy(addr1.address);
    expect(strategy.isActive).to.be.false;
  });

  it("should allow governance to reactivate strategy", async function () {
    await strategyManager.addStrategy(addr1.address, "Aave", "Lending", 1000, 500, 30, addr2.address);
    await strategyManager.deactivateStrategy(addr1.address);
    await strategyManager.reactivateStrategy(addr1.address);
    const strategy = await strategyManager.getStrategy(addr1.address);
    expect(strategy.isActive).to.be.true;
  });

  it("should allow governance to update allocation within max", async function () {
    const maxAlloc = ethers.parseUnits("1000", 18);
    await strategyManager.addStrategy(addr1.address, "Aave", "Lending", maxAlloc, 500, 30, addr2.address);
    const newAlloc = ethers.parseUnits("500", 18);
    await strategyManager.updateAllocation(addr1.address, newAlloc);
    const strategy = await strategyManager.getStrategy(addr1.address);
    expect(strategy.currentAllocation).to.equal(newAlloc);
  });

  it("should revert allocation exceeding max", async function () {
    const maxAlloc = ethers.parseUnits("500", 18);
    await strategyManager.addStrategy(addr1.address, "Aave", "Lending", maxAlloc, 500, 30, addr2.address);
    await expect(
      strategyManager.updateAllocation(addr1.address, ethers.parseUnits("600", 18))
    ).to.be.revertedWith("Exceeds max allocation");
  });

  it("should return all strategies", async function () {
    await strategyManager.addStrategy(addr1.address, "Aave", "Lending", 1000, 500, 30, addr2.address);
    await strategyManager.addStrategy(addr2.address, "Curve", "Stableswap", 2000, 300, 20, owner.address);
    const all = await strategyManager.getAllStrategies();
    expect(all.length).to.equal(2);
    expect(all[0].name).to.equal("Aave");
    expect(all[1].name).to.equal("Curve");
  });

  it("should revert operations on non-existent strategy", async function () {
    await expect(
      strategyManager.updateStrategy(addr1.address, 600, 40)
    ).to.be.revertedWith("Strategy not found");
    await expect(
      strategyManager.deactivateStrategy(addr1.address)
    ).to.be.revertedWith("Strategy not found");
  });

  it("should revert non-admin adding strategy", async function () {
    await expect(
      strategyManager.connect(addr1).addStrategy(addr2.address, "Bad", "No", 1000, 500, 30, owner.address)
    ).to.be.revertedWithCustomError(strategyManager, "AccessControlUnauthorizedAccount");
  });
});
