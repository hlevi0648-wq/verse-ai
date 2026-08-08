const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GameLobby", function () {
  let verseToken, lobby, owner, player1, player2, treasury;

  beforeEach(async function () {
    [owner, player1, player2, treasury] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    verseToken = await MockERC20.deploy("Verse Token", "VERSE", ethers.parseEther("1000000"));
    await verseToken.waitForDeployment();
    const GameLobby = await ethers.getContractFactory("GameLobby");
    lobby = await GameLobby.deploy(await verseToken.getAddress(), treasury.address, 1000);
    await lobby.waitForDeployment();
    await verseToken.transfer(player1.address, ethers.parseEther("10000"));
    await verseToken.transfer(player2.address, ethers.parseEther("10000"));
    await verseToken.connect(player1).approve(await lobby.getAddress(), ethers.MaxUint256);
    await verseToken.connect(player2).approve(await lobby.getAddress(), ethers.MaxUint256);
  });

  it("should create a room", async function () {
    await lobby.createRoom("fish_shooter", ethers.parseEther("100"), 10);
    const room = await lobby.rooms(0);
    expect(room.gameType).to.equal("fish_shooter");
    expect(room.buyIn).to.equal(ethers.parseEther("100"));
  });

  it("should allow player to join room", async function () {
    await lobby.createRoom("fish_shooter", ethers.parseEther("100"), 10);
    await lobby.connect(player1).joinRoom(0);
    const room = await lobby.rooms(0);
    expect(room.activePlayers).to.equal(1);
  });

  it("should reject joining when room is full", async function () {
    await lobby.createRoom("fish_shooter", ethers.parseEther("100"), 1);
    await lobby.connect(player1).joinRoom(0);
    await expect(lobby.connect(player2).joinRoom(0)).to.be.revertedWith("Room full");
  });
});