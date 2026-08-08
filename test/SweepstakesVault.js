const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SweepstakesVault", function () {
  let verseToken, vault, owner, player1, player2, treasury;

  beforeEach(async function () {
    [owner, player1, player2, treasury] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    verseToken = await MockERC20.deploy("Verse Token", "VERSE", ethers.parseEther("1000000"));
    await verseToken.waitForDeployment();
    const SweepstakesVault = await ethers.getContractFactory("SweepstakesVault");
    vault = await SweepstakesVault.deploy(await verseToken.getAddress(), treasury.address);
    await vault.waitForDeployment();
    await verseToken.transfer(player1.address, ethers.parseEther("10000"));
    await verseToken.transfer(player2.address, ethers.parseEther("10000"));
    await verseToken.connect(player1).approve(await vault.getAddress(), ethers.MaxUint256);
    await verseToken.connect(player2).approve(await vault.getAddress(), ethers.MaxUint256);
  });

  it("should create a sweepstake", async function () {
    const now = await time.latest();
    await vault.createSweepstake(ethers.parseEther("100"), 100, now + 60, now + 3600, 1000);
    const s = await vault.sweepstakes(0);
    expect(s.entryFee).to.equal(ethers.parseEther("100"));
    expect(s.maxEntries).to.equal(100);
  });

  it("should allow entries", async function () {
    const now = await time.latest();
    await vault.createSweepstake(ethers.parseEther("100"), 100, now, now + 3600, 1000);
    await vault.connect(player1).enter(0, ethers.ZeroHash);
    const s = await vault.sweepstakes(0);
    expect(s.entryCount).to.equal(1);
    expect(s.prizePool).to.equal(ethers.parseEther("90"));
  });

  it("should draw a winner", async function () {
    const now = await time.latest();
    await vault.createSweepstake(ethers.parseEther("100"), 100, now, now + 60, 1000);
    await vault.connect(player1).enter(0, ethers.ZeroHash);
    await vault.connect(player2).enter(0, ethers.ZeroHash);
    await time.increase(61);
    await vault.draw(0, 12345);
    const s = await vault.sweepstakes(0);
    expect(s.drawn).to.be.true;
    expect([player1.address, player2.address]).to.include(s.winner);
  });

  it("should reject entries after close", async function () {
    const now = await time.latest();
    await vault.createSweepstake(ethers.parseEther("100"), 100, now, now + 60, 1000);
    await time.increase(61);
    await expect(vault.connect(player1).enter(0, ethers.ZeroHash)).to.be.revertedWith("Entries closed");
  });
});