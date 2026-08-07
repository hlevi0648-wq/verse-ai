const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Treasury", function () {
  let verseToken, treasury, owner, addr1, addr2;
  const DEPOSIT_AMOUNT = ethers.parseUnits("10000", 18);

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const VerseToken = await ethers.getContractFactory("VerseToken");
    verseToken = await VerseToken.deploy(owner.address);
    await verseToken.waitForDeployment();

    const Treasury = await ethers.getContractFactory("Treasury");
    treasury = await Treasury.deploy(owner.address);
    await treasury.waitForDeployment();

    // Approve token and approve it in treasury
    await verseToken.approve(await treasury.getAddress(), ethers.MaxUint256);
    await treasury.approveToken(await verseToken.getAddress());
  });

  it("should allow treasurer to deposit tokens", async function () {
    await treasury.depositToken(await verseToken.getAddress(), DEPOSIT_AMOUNT);
    expect(await treasury.tokenBalances(await verseToken.getAddress())).to.equal(DEPOSIT_AMOUNT);
  });

  it("should emit TokenDeposited event", async function () {
    await expect(treasury.depositToken(await verseToken.getAddress(), DEPOSIT_AMOUNT))
      .to.emit(treasury, "TokenDeposited");
  });

  it("should revert deposit of unapproved token", async function () {
    const FakeToken = await ethers.getContractFactory("VerseToken");
    const fakeToken = await FakeToken.deploy(owner.address);
    await fakeToken.waitForDeployment();
    await fakeToken.approve(await treasury.getAddress(), DEPOSIT_AMOUNT);
    await expect(
      treasury.depositToken(await fakeToken.getAddress(), DEPOSIT_AMOUNT)
    ).to.be.revertedWith("Token not approved");
  });

  it("should revert deposit with zero amount", async function () {
    await expect(
      treasury.depositToken(await verseToken.getAddress(), 0)
    ).to.be.revertedWith("Invalid amount");
  });

  it("should allow treasurer to withdraw tokens", async function () {
    await treasury.depositToken(await verseToken.getAddress(), DEPOSIT_AMOUNT);
    const withdrawAmount = ethers.parseUnits("5000", 18);
    await treasury.withdrawToken(await verseToken.getAddress(), withdrawAmount, addr1.address);
    expect(await verseToken.balanceOf(addr1.address)).to.equal(withdrawAmount);
  });

  it("should revert withdraw with insufficient balance", async function () {
    await treasury.depositToken(await verseToken.getAddress(), DEPOSIT_AMOUNT);
    const overBalance = DEPOSIT_AMOUNT + 1n;
    await expect(
      treasury.withdrawToken(await verseToken.getAddress(), overBalance, addr1.address)
    ).to.be.revertedWith("Insufficient balance");
  });

  it("should revert withdraw to zero address", async function () {
    await treasury.depositToken(await verseToken.getAddress(), DEPOSIT_AMOUNT);
    await expect(
      treasury.withdrawToken(await verseToken.getAddress(), DEPOSIT_AMOUNT, ethers.ZeroAddress)
    ).to.be.revertedWith("Invalid recipient");
  });

  it("should allow governance to set strategy limits", async function () {
    const limit = ethers.parseUnits("1000", 18);
    await treasury.setStrategyLimit(addr1.address, limit);
    expect(await treasury.strategyLimits(addr1.address)).to.equal(limit);
  });

  it("should allow governance to allocate to strategy within limit", async function () {
    const limit = ethers.parseUnits("1000", 18);
    await treasury.setStrategyLimit(addr1.address, limit);
    const allocateAmount = ethers.parseUnits("500", 18);
    await treasury.allocateToStrategy(addr1.address, allocateAmount);
    expect(await treasury.strategyAllocations(addr1.address)).to.equal(allocateAmount);
  });

  it("should revert allocation exceeding strategy limit", async function () {
    const limit = ethers.parseUnits("500", 18);
    await treasury.setStrategyLimit(addr1.address, limit);
    await expect(
      treasury.allocateToStrategy(addr1.address, ethers.parseUnits("600", 18))
    ).to.be.revertedWith("Exceeds strategy limit");
  });

  it("should allow governance to deallocate from strategy", async function () {
    const limit = ethers.parseUnits("1000", 18);
    await treasury.setStrategyLimit(addr1.address, limit);
    const allocateAmount = ethers.parseUnits("500", 18);
    await treasury.allocateToStrategy(addr1.address, allocateAmount);
    await treasury.deallocateFromStrategy(addr1.address, allocateAmount);
    expect(await treasury.strategyAllocations(addr1.address)).to.equal(0);
  });

  it("should revert deallocation with insufficient allocation", async function () {
    await expect(
      treasury.deallocateFromStrategy(addr1.address, ethers.parseUnits("1", 18))
    ).to.be.revertedWith("Insufficient allocation");
  });

  it("should allow governance to approve and revoke tokens", async function () {
    const FakeToken = await ethers.getContractFactory("VerseToken");
    const fakeToken = await FakeToken.deploy(owner.address);
    await fakeToken.waitForDeployment();
    await treasury.approveToken(await fakeToken.getAddress());
    expect(await treasury.approvedTokens(await fakeToken.getAddress())).to.be.true;
    await treasury.revokeToken(await fakeToken.getAddress());
    expect(await treasury.approvedTokens(await fakeToken.getAddress())).to.be.false;
  });

  it("should revert non-treasurer deposit", async function () {
    await expect(
      treasury.connect(addr1).depositToken(await verseToken.getAddress(), DEPOSIT_AMOUNT)
    ).to.be.revertedWithCustomError(treasury, "AccessControlUnauthorizedAccount");
  });

  it("should revert non-governance strategy limit", async function () {
    await expect(
      treasury.connect(addr1).setStrategyLimit(addr1.address, DEPOSIT_AMOUNT)
    ).to.be.revertedWithCustomError(treasury, "AccessControlUnauthorizedAccount");
  });
});
