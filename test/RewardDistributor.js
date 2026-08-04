const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("RewardDistributor", function () {
  let verseToken, stakingVault, rewardDistributor, owner, addr1, addr2;
  const STAKE_AMOUNT = ethers.parseUnits("1000", 18);
  const REWARD_AMOUNT = ethers.parseUnits("500", 18);

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

    const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
    rewardDistributor = await RewardDistributor.deploy(
      await verseToken.getAddress(),
      await stakingVault.getAddress(),
      owner.address
    );
    await rewardDistributor.waitForDeployment();

    // Fund and approve
    await verseToken.mint(addr1.address, ethers.parseUnits("10000", 18));
    await verseToken.mint(addr2.address, ethers.parseUnits("10000", 18));
    await verseToken.mint(owner.address, ethers.parseUnits("10000", 18));
    await verseToken.connect(addr1).approve(await stakingVault.getAddress(), ethers.MaxUint256);
    await verseToken.connect(addr2).approve(await stakingVault.getAddress(), ethers.MaxUint256);
    await verseToken.approve(await rewardDistributor.getAddress(), ethers.MaxUint256);
  });

  it("should allow owner to deposit rewards", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await rewardDistributor.depositRewards(REWARD_AMOUNT);
    expect(await rewardDistributor.totalRewardsDistributed()).to.equal(REWARD_AMOUNT);
  });

  it("should emit RewardsDeposited event", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await expect(rewardDistributor.depositRewards(REWARD_AMOUNT))
      .to.emit(rewardDistributor, "RewardsDeposited")
      .withArgs(REWARD_AMOUNT, (v) => v > 0n);
  });

  it("should revert deposit with zero amount", async function () {
    await expect(rewardDistributor.depositRewards(0)).to.be.revertedWith(
      "Invalid amount"
    );
  });

  it("should revert deposit when no stakers", async function () {
    await expect(rewardDistributor.depositRewards(REWARD_AMOUNT)).to.be.revertedWith(
      "No stakers"
    );
  });

  it("should calculate pending rewards correctly", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await rewardDistributor.depositRewards(REWARD_AMOUNT);
    expect(await rewardDistributor.pendingRewards(addr1.address)).to.equal(REWARD_AMOUNT);
  });

  it("should distribute rewards proportionally", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await stakingVault.connect(addr2).stake(STAKE_AMOUNT);
    await rewardDistributor.depositRewards(REWARD_AMOUNT);

    // Each staker has 50% of total, so each gets 50% of rewards
    const halfReward = REWARD_AMOUNT / 2n;
    expect(await rewardDistributor.pendingRewards(addr1.address)).to.equal(halfReward);
    expect(await rewardDistributor.pendingRewards(addr2.address)).to.equal(halfReward);
  });

  it("should allow users to claim rewards", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await rewardDistributor.depositRewards(REWARD_AMOUNT);

    const balanceBefore = await verseToken.balanceOf(addr1.address);
    await rewardDistributor.connect(addr1).claim();
    const balanceAfter = await verseToken.balanceOf(addr1.address);

    expect(balanceAfter - balanceBefore).to.equal(REWARD_AMOUNT);
  });

  it("should emit RewardsClaimed on claim", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await rewardDistributor.depositRewards(REWARD_AMOUNT);
    await expect(rewardDistributor.connect(addr1).claim())
      .to.emit(rewardDistributor, "RewardsClaimed")
      .withArgs(addr1.address, REWARD_AMOUNT, (v) => v > 0n);
  });

  it("should revert claim with no rewards", async function () {
    await expect(rewardDistributor.connect(addr1).claim()).to.be.revertedWith(
      "No rewards"
    );
  });

  it("should return 0 pending rewards for non-staker", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await rewardDistributor.depositRewards(REWARD_AMOUNT);
    expect(await rewardDistributor.pendingRewards(addr2.address)).to.equal(0);
  });

  it("should track rewardsClaimed", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await rewardDistributor.depositRewards(REWARD_AMOUNT);
    await rewardDistributor.connect(addr1).claim();
    const stats = await rewardDistributor.getRewardStats(addr1.address);
    expect(stats.claimed).to.equal(REWARD_AMOUNT);
  });

  it("should revert deposit from non-owner", async function () {
    await stakingVault.connect(addr1).stake(STAKE_AMOUNT);
    await verseToken.connect(addr1).approve(await rewardDistributor.getAddress(), REWARD_AMOUNT);
    await expect(
      rewardDistributor.connect(addr1).depositRewards(REWARD_AMOUNT)
    ).to.be.revertedWithCustomError(rewardDistributor, "OwnableUnauthorizedAccount");
  });
});
