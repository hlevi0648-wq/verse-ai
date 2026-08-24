const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VerseToken", function () {
  let verseToken, owner, addr1;
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 18);
  const MAX_SUPPLY = ethers.parseUnits("1000000000", 18);

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const VerseToken = await ethers.getContractFactory("VerseToken");
    verseToken = await VerseToken.deploy(owner.address);
    await verseToken.waitForDeployment();
  });

  it("should have correct name and symbol", async function () {
    expect(await verseToken.name()).to.equal("VerseToken");
    expect(await verseToken.symbol()).to.equal("VERSE");
  });

  it("should mint initial supply to owner", async function () {
    expect(await verseToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
  });

  it("should allow owner to mint more tokens", async function () {
    const mintAmount = ethers.parseUnits("1000", 18);
    await verseToken.mint(addr1.address, mintAmount);
    expect(await verseToken.balanceOf(addr1.address)).to.equal(mintAmount);
  });

  it("should revert mint if max supply exceeded", async function () {
    const mintAmount = ethers.parseUnits("999999000", 18);
    await expect(verseToken.mint(addr1.address, mintAmount)).to.be.revertedWithCustomError(
      verseToken, "ERC20ExceededCap"
    );
  });

  it("should revert mint from non-owner", async function () {
    const mintAmount = ethers.parseUnits("1000", 18);
    await expect(verseToken.connect(addr1).mint(addr1.address, mintAmount)).to.be.revertedWithCustomError(
      verseToken, "OwnableUnauthorizedAccount"
    );
  });

  it("should allow any holder to burn their tokens", async function () {
    const burnAmount = ethers.parseUnits("1000", 18);
    await verseToken.connect(owner).burn(burnAmount);
    expect(await verseToken.totalSupply()).to.equal(INITIAL_SUPPLY - burnAmount);
  });

  it("should revert burn if insufficient balance", async function () {
    const burnAmount = ethers.parseUnits("1", 18);
    await expect(verseToken.connect(addr1).burn(burnAmount)).to.be.revertedWithCustomError(
      verseToken, "ERC20InsufficientBalance"
    );
  });

  it("should support ERC20Votes functionality", async function () {
    await verseToken.delegate(owner.address);
    expect(await verseToken.getVotes(owner.address)).to.equal(INITIAL_SUPPLY);
  });

  it("should have correct max supply constant", async function () {
    expect(await verseToken.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
  });
});
