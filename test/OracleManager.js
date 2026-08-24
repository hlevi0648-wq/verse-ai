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
    const pairHash = ethers.solidityPackedKeccak256(["address", "address"], [addr1.address, addr2.address]);
    const feed = await oracleManager.priceFeeds(pairHash);
    expect(feed.feedAddress).to.equal(await mockAggregator.getAddress());
    expect(feed.isActive).to.be.true;
  });

  it("should use default stale delay when zero provided", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), 0);
    const pairHash = ethers.solidityPackedKeccak256(["address", "address"], [addr1.address, addr2.address]);
    const feed = await oracleManager.priceFeeds(pairHash);
    expect(feed.staleDelay).to.equal(3600);
  });

  it("should revert if non-admin adds price feed", async function () {
    await expect(
      oracleManager.connect(addr1).addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY)
    ).to.be.reverted;
  });

  it("should get latest price", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY);
    const price = await oracleManager.getLatestPrice(addr1.address, addr2.address);
    expect(price).to.equal(200000000000);
  });

  it("should revert if price feed not found", async function () {
    await expect(
      oracleManager.getLatestPrice(addr1.address, addr2.address)
    ).to.be.revertedWithCustomError(oracleManager, "PriceFeedNotFound");
  });

  it("should store reverse pair hash", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY);
    const reverseHash = ethers.solidityPackedKeccak256(["address", "address"], [addr2.address, addr1.address]);
    const feed = await oracleManager.priceFeeds(reverseHash);
    expect(feed.feedAddress).to.equal(await mockAggregator.getAddress());
  });

  it("should deactivate a price feed", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY);
    await oracleManager.deactivatePriceFeed(addr1.address, addr2.address);
    const pairHash = ethers.solidityPackedKeccak256(["address", "address"], [addr1.address, addr2.address]);
    const feed = await oracleManager.priceFeeds(pairHash);
    expect(feed.isActive).to.be.false;
  });

  it("should emit PriceFeedDeactivated event", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY);
    const pairHash = ethers.solidityPackedKeccak256(["address", "address"], [addr1.address, addr2.address]);
    await expect(oracleManager.deactivatePriceFeed(addr1.address, addr2.address))
      .to.emit(oracleManager, "PriceFeedDeactivated")
      .withArgs(pairHash);
  });

  it("should reactivate a price feed", async function () {
    await oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY);
    await oracleManager.deactivatePriceFeed(addr1.address, addr2.address);
    await oracleManager.reactivatePriceFeed(addr1.address, addr2.address);
    const pairHash = ethers.solidityPackedKeccak256(["address", "address"], [addr1.address, addr2.address]);
    const feed = await oracleManager.priceFeeds(pairHash);
    expect(feed.isActive).to.be.true;
  });

  it("should emit PriceFeedAdded event", async function () {
    const pairHash = ethers.solidityPackedKeccak256(["address", "address"], [addr1.address, addr2.address]);
    await expect(oracleManager.addPriceFeed(addr1.address, addr2.address, await mockAggregator.getAddress(), STALE_DELAY))
      .to.emit(oracleManager, "PriceFeedAdded")
      .withArgs(pairHash, await mockAggregator.getAddress(), STALE_DELAY);
  });
});
