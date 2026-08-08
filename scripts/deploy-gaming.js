const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying gaming contracts with:", deployer.address);

  const verseTokenAddress = process.env.VERSE_TOKEN_ADDRESS;
  if (!verseTokenAddress) {
    throw new Error("Set VERSE_TOKEN_ADDRESS in .env");
  }

  console.log("\nDeploying ProvablyFair...");
  const ProvablyFair = await hre.ethers.getContractFactory("ProvablyFair");
  const provablyFair = await ProvablyFair.deploy();
  await provablyFair.waitForDeployment();
  const provablyFairAddr = await provablyFair.getAddress();
  console.log("ProvablyFair deployed to:", provablyFairAddr);

  console.log("\nDeploying SweepstakesVault...");
  const SweepstakesVault = await hre.ethers.getContractFactory("SweepstakesVault");
  const sweepstakesVault = await SweepstakesVault.deploy(verseTokenAddress, deployer.address);
  await sweepstakesVault.waitForDeployment();
  const sweepstakesVaultAddr = await sweepstakesVault.getAddress();
  console.log("SweepstakesVault deployed to:", sweepstakesVaultAddr);

  console.log("\nDeploying GameLobby...");
  const GameLobby = await hre.ethers.getContractFactory("GameLobby");
  const gameLobby = await GameLobby.deploy(verseTokenAddress, deployer.address, 1000);
  await gameLobby.waitForDeployment();
  const gameLobbyAddr = await gameLobby.getAddress();
  console.log("GameLobby deployed to:", gameLobbyAddr);

  console.log("\n=== Deployment Summary ===");
  console.log("ProvablyFair:", provablyFairAddr);
  console.log("SweepstakesVault:", sweepstakesVaultAddr);
  console.log("GameLobby:", gameLobbyAddr);
}

main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });