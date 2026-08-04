const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("StakingVault", function () {
  let verseToken, stakingVault, owner, addr1, addr2;
  const STAKE_AMOUNT = ethers.parseUnits("1000", 18);

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const VerseToken = await ethers.getContractFactory("VerseToken");
    verseToken = await VerseToken.deploy(owner.address);
    await verseToken.waitForDeployment();

    const StakingVault = await ethers.getContractFactory("StakingVault");
    stakingVault = await StakingVault.deploy(
      await verseToken.getAddress(),
      owner.address
    );
    await stakingVault.waitForDeployment();

    // Fund addr1 and addr2 with tokens and approve staking vault
    await verseToken.mint(addr1.address, ethers.parseUnits("10000", 18));
    await verseToken.mint(addr2.address, ethers.parseUnits("10000", 18));
    await verseToken.connect(addr1).approve(await stakingVault.getAddress(), ethers.MaxUint256);
    await verseToken.connect(addr2).approve(await stakingVault.getAddress(), ethers.MaxUint256);
  });

  it("should allow users to stake tokens", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    expect(await stakingVault.stakedBalance(addr1.address)).to.equal(STAKE_AMOUNT);
    expect(await stakingVault.totalStaked()).to.equal(STAKE_AMOUNT);
  });

  it("should emit Staked event on stake", async function () {
    await expect(stakingVault.connect(addr1).stake(STAKE_AMOUNT))
      .to.emit(stakingVault, "Staked")
      .withArgs(addr1.address, STAKE_AMOUNT, (v) => v > 0n);
  });

  it("should revert stake with zero amount", async function () {
    await expect(stakingVault.connect(addr1).stake(0)).to.be.revertedWith(
      "Invalid amount"
    );
  });

  it("should revert unstake during unbond period", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await expect(
      stakingVault.connect(addr1).unstake(STAKE_AMOUNT)
    ).to.be.revertedWith("Still in unbond period");
  });

  it("should allow unstake after unbond period", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await time.increase(7 * 24 * 60 * 60); // 7 days
    await stakingVault.connect(addr1).unstake(STAKE_AMOUNT);
    expect(await stakingVault.stakedBalance(addr1.address)).to.equal(0);
    expect(await stakingVault.totalStaked()).to.equal(0);
  });

  it("should revert unstake with insufficient stake", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await time.increase(7 * 24 * 60 * 60);
    await expect(
      stakingVault.connect(addr1).unstake(STAKE_AMOUNT + 1n)
    ).to.be.revertedWith("Insufficient stake");
  });

  it("should revert unstake with zero amount", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await time.increase(7 * 24 * 60 * 60);
    await expect(stakingVault.connect(addr1).unstake(0)).to.be.revertedWith(
      "Invalid amount"
    );
  });

  it("should revert unstake when paused", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await time.increase(7 * 24 * 60 * 60);
    await stakingVault.pause();
    await expect(
      stakingVault.connect(addr1).unstake(STAKE_AMOUNT)
    ).to.be.revertedWithCustomError(stakingVault, "EnforcedPause");
  });

  it("should revert stake when paused", async function () {
    await stakingVault.pause();
    await expect(
      stakingVault.connect(addr1).stake(STAKE_AMOUNT)
    ).to.be.revertedWithCustomError(stakingVault, "EnforcedPause");
  });

  it("should allow owner to pause and unpause", async function () {
    await stakingVault.pause();
    expect(await stakingVault.paused()).to.be.true;
    await stakingVault.unpause();
    expect(await stakingVault.paused()).to.be.false;
  });

  it("should revert pause from non-owner", async function () {
    await expect(
      stakingVault.connect(addr1).pause()
    ).to.be.revertedWithCustomError(stakingVault, "OwnableUnauthorizedAccount");
  });

  it("should track balanceOf correctly", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    expect(await stakingVault.balanceOf(addr1.address)).to.equal(STAKE_AMOUNT);
  });

  it("should allow multiple users to stake", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await stakingVault.connect(addr2).stake(STAKE_AMOUNT);
    expect(await stakingVault.totalStaked()).to.equal(STAKE_AMOUNT * 2n);
  });
});
