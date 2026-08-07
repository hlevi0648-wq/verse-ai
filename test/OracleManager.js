const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("OracleManager", function () {
  let oracleManager, mockAggregator, owner, addr1, addr2;
  const STALE_DELAY = 3600;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MockAggregator = await ethers.getContractFactory("MockAggregatorV3");
    mockAggregator = await MockAggregator.deploy(8, 200000000000);
    await mockAggregator.waitForDeployment();

    const OracleManager = await ethers.getContractFactory("OracleManager");
    oracleManager = await OracleManager.deploy(owner.address);
    await oracleManager.waitForDeployment();
  });

  it("should allow admin to add a price feed", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY);
    const pairHash = ethers.solidityKeccak256(["address", "address"], [addr1.address, addr2.address]);
    const feed = await oracleManager.priceFeeds(pairHash);
    expect(feed.feedAddress).to.equal(await mockAggregator.getAddress());
    expect(feed.isActive).to.be.true;
  });

  it("should use default stale delay when zero provided", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), 0);
    const pairHash = ethers.solidityKeccak256(["address", "address"], [addr1.address, addr2.address]);
    const feed = await oracleManager.priceFeeds(pairHash);
    expect(feed.stalePriceDelay).to.equal(3600);
  });

  it("should revert adding feed with zero address", async function () {
    await expect(
      oracleManager.addPriceFeed(addr1.address, addr2.address, ethers.ZeroAddress, STALE_DELAY)
    ).to.be.revertedWith("Invalid feed address");
  });

  it("should get price from feed", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY);
    const [price, timestamp, isStale] = await oracleManager.getPrice(addr1.address, addr2.address);
    expect(price).to.equal(200000000000);
    expect(isStale).to.be.false;
  });

  it("should detect stale price", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY);
    await time.increase(STALE_DELAY + 1);
    const [price, timestamp, isStale] = await oracleManager.getPrice(addr1.address, addr2.address);
    expect(isStale).to.be.true;
  });

  it("should revert price for unknown pair", async function () {
    await expect(
      oracleManager.getPrice(addr1.address, addr2.address)
    ).to.be.revertedWith("Price feed not found");
  });

  it("should support bidirectional pair lookup", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY);
    // Reverse order should now work
    const [price, timestamp, isStale] = await oracleManager.getPrice(addr2.address, addr1.address);
    expect(price).to.equal(200000000000);
    expect(isStale).to.be.false;
  });

  it("should store reverse pair hash", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY);
    const pairHash = ethers.solidityKeccak256(["address", "address"], [addr1.address, addr2.address]);
    const reverseHash = ethers.solidityKeccak256(["address", "address"], [addr2.address, addr1.address]);
    expect(await oracleManager.reversePairHash(pairHash)).to.equal(reverseHash);
    expect(await oracleManager.reversePairHash(reverseHash)).to.equal(pairHash);
  });

  it("should allow admin to deactivate a price feed", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY);
    await oracleManager.deactivatePriceFeed(addr1.address, addr2.address);
    // Forward direction should be inactive
    await expect(
      oracleManager.getPrice(addr1.address, addr2.address)
    ).to.be.revertedWith("Price feed inactive");
    // Reverse direction should also be inactive
    await expect(
      oracleManager.getPrice(addr2.address, addr1.address)
    ).to.be.revertedWith("Price feed inactive");
  });

  it("should emit PriceFeedDeactivated event", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY);
    const pairHash = ethers.solidityKeccak256(["address", "address"], [addr1.address, addr2.address]);
    await expect(oracleManager.deactivatePriceFeed(addr1.address, addr2.address))
      .to.emit(oracleManager, "PriceFeedDeactivated")
      .withArgs(pairHash);
  });

  it("should revert deactivation of non-existent feed", async function () {
    await expect(
      oracleManager.deactivatePriceFeed(addr1.address, addr2.address)
    ).to.be.revertedWith("Price feed not found");
  });

  it("should revert non-admin adding feed", async function () {
    await expect(
      oracleManager.connect(addr1).addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY)
    ).to.be.revertedWithCustomError(oracleManager, "AccessControlUnauthorizedAccount");
  });

  it("should revert non-admin deactivating feed", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY);
    await expect(
      oracleManager.connect(addr1).deactivatePriceFeed(addr1.address, addr2.address)
    ).to.be.revertedWithCustomError(oracleManager, "AccessControlUnauthorizedAccount");
  });

  it("should emit PriceFeedAdded event", async function () {
    const pairHash = ethers.solidityKeccak256(["address", "address"], [addr1.address, addr2.address]);
    await expect(
      oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY)
    ).to.emit(oracleManager, "PriceFeedAdded").withArgs(pairHash, await mockAggregator.getAddress(), STALE_DELAY);
  });
});
