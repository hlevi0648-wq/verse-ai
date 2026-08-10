const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  const VerseToken = await hre.ethers.getContractFactory("VerseToken");
  const verseToken = await VerseToken.deploy(deployer.address);
  await verseToken.waitForDeployment();
  const verseTokenAddr = await verseToken.getAddress();
  console.log("VerseToken deployed to:", verseTokenAddr);

  const StakingVault = await hre.ethers.getContractFactory("StakingVault");
  const stakingVault = await StakingVault.deploy(verseTokenAddr, deployer.address);
  await stakingVault.waitForDeployment();
  const stakingVaultAddr = await stakingVault.getAddress();
  console.log("StakingVault deployed to:", stakingVaultAddr);

  const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
  const rewardDistributor = await RewardDistributor.deploy(verseTokenAddr, stakingVaultAddr, deployer.address);
  await rewardDistributor.waitForDeployment();
  const rewardDistributorAddr = await rewardDistributor.getAddress();
  console.log("RewardDistributor deployed to:", rewardDistributorAddr);

  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(deployer.address);
  await treasury.waitForDeployment();
  const treasuryAddr = await treasury.getAddress();
  console.log("Treasury deployed to:", treasuryAddr);

  const StrategyManager = await hre.ethers.getContractFactory("StrategyManager");
  const strategyManager = await StrategyManager.deploy(deployer.address);
  await strategyManager.waitForDeployment();
  const strategyManagerAddr = await strategyManager.getAddress();
  console.log("StrategyManager deployed to:", strategyManagerAddr);

  const OracleManager = await hre.ethers.getContractFactory("OracleManager");
  const oracleManager = await OracleManager.deploy(deployer.address);
  await oracleManager.waitForDeployment();
  const oracleManagerAddr = await oracleManager.getAddress();
  console.log("OracleManager deployed to:", oracleManagerAddr);

  const EmergencyPause = await hre.ethers.getContractFactory("EmergencyPause");
  const emergencyPause = await EmergencyPause.deploy(deployer.address);
  await emergencyPause.waitForDeployment();
  const emergencyPauseAddr = await emergencyPause.getAddress();
  console.log("EmergencyPause deployed to:", emergencyPauseAddr);

  const WithdrawalManager = await hre.ethers.getContractFactory("WithdrawalManager");
  const withdrawalManager = await WithdrawalManager.deploy(verseTokenAddr, deployer.address);
  await withdrawalManager.waitForDeployment();
  const withdrawalManagerAddr = await withdrawalManager.getAddress();
  console.log("WithdrawalManager deployed to:", withdrawalManagerAddr);

  console.log("\n=== Deployment Summary ===");
  console.log("VerseToken:", verseTokenAddr);
  console.log("StakingVault:", stakingVaultAddr);
  console.log("RewardDistributor:", rewardDistributorAddr);
  console.log("Treasury:", treasuryAddr);
  console.log("StrategyManager:", strategyManagerAddr);
  console.log("OracleManager:", oracleManagerAddr);
  console.log("EmergencyPause:", emergencyPauseAddr);
  console.log("WithdrawalManager:", withdrawalManagerAddr);

  const fs = require("fs");
  const envPath = ".env";
  let envContent = "";
  if (fs.existsSync(envPath)) { envContent = fs.readFileSync(envPath, "utf8"); }
  const updates = {
    VERSE_TOKEN_ADDRESS: verseTokenAddr,
    STAKING_VAULT_ADDRESS: stakingVaultAddr,
    REWARD_DISTRIBUTOR_ADDRESS: rewardDistributorAddr,
    TREASURY_ADDRESS: treasuryAddr,
    STRATEGY_MANAGER_ADDRESS: strategyManagerAddr,
    ORACLE_MANAGER_ADDRESS: oracleManagerAddr,
    EMERGENCY_PAUSE_ADDRESS: emergencyPauseAddr,
    WITHDRAWAL_MANAGER_ADDRESS: withdrawalManagerAddr,
  };
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) { envContent = envContent.replace(regex, `${key}=${value}`); }
    else { envContent += `\n${key}=${value}`; }
  }
  fs.writeFileSync(envPath, envContent);
  console.log("\n✅ Contract addresses saved to .env");
}

main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
