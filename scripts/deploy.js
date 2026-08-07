const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // 1. Deploy VerseToken
  const VerseToken = await hre.ethers.getContractFactory("VerseToken");
  const verseToken = await VerseToken.deploy(deployer.address);
  await verseToken.waitForDeployment();
  const verseTokenAddr = await verseToken.getAddress();
  console.log("VerseToken deployed to:", verseTokenAddr);

  // 2. Deploy StakingVault
  const StakingVault = await hre.ethers.getContractFactory("StakingVault");
  const stakingVault = await StakingVault.deploy(verseTokenAddr, deployer.address);
  await stakingVault.waitForDeployment();
  const stakingVaultAddr = await stakingVault.getAddress();
  console.log("StakingVault deployed to:", stakingVaultAddr);

  // 3. Deploy RewardDistributor
  const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
  const rewardDistributor = await RewardDistributor.deploy(
    verseTokenAddr,
    stakingVaultAddr,
    deployer.address
  );
  await rewardDistributor.waitForDeployment();
  const rewardDistributorAddr = await rewardDistributor.getAddress();
  console.log("RewardDistributor deployed to:", rewardDistributorAddr);

  // 4. Deploy Treasury
  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(deployer.address);
  await treasury.waitForDeployment();
  const treasuryAddr = await treasury.getAddress();
  console.log("Treasury deployed to:", treasuryAddr);

  // 5. Deploy StrategyManager
  const StrategyManager = await hre.ethers.getContractFactory("StrategyManager");
  const strategyManager = await StrategyManager.deploy(deployer.address);
  await strategyManager.waitForDeployment();
  const strategyManagerAddr = await strategyManager.getAddress();
  console.log("StrategyManager deployed to:", strategyManagerAddr);

  // 6. Deploy OracleManager
  const OracleManager = await hre.ethers.getContractFactory("OracleManager");
  const oracleManager = await OracleManager.deploy(deployer.address);
  await oracleManager.waitForDeployment();
  const oracleManagerAddr = await oracleManager.getAddress();
  console.log("OracleManager deployed to:", oracleManagerAddr);

  // 7. Deploy EmergencyPause
  const EmergencyPause = await hre.ethers.getContractFactory("EmergencyPause");
  const emergencyPause = await EmergencyPause.deploy(deployer.address);
  await emergencyPause.waitForDeployment();
  const emergencyPauseAddr = await emergencyPause.getAddress();
  console.log("EmergencyPause deployed to:", emergencyPauseAddr);

  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log("VerseToken:", verseTokenAddr);
  console.log("StakingVault:", stakingVaultAddr);
  console.log("RewardDistributor:", rewardDistributorAddr);
  console.log("Treasury:", treasuryAddr);
  console.log("StrategyManager:", strategyManagerAddr);
  console.log("OracleManager:", oracleManagerAddr);
  console.log("EmergencyPause:", emergencyPauseAddr);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
