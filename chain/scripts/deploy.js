const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("═══════════════════════════════════════════");
  console.log("  Verse Chain — Deploy Contracts");
  console.log("═══════════════════════════════════════════");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const contracts = {};

  console.log("\n📦 Deploying VerseToken...");
  const VerseToken = await ethers.getContractFactory("VerseToken");
  const verseToken = await VerseToken.deploy(deployer.address);
  await verseToken.waitForDeployment();
  contracts.VerseToken = await verseToken.getAddress();
  console.log("   ✅ VerseToken:", contracts.VerseToken);

  console.log("\n📦 Deploying StakingVault...");
  const StakingVault = await ethers.getContractFactory("StakingVault");
  const stakingVault = await StakingVault.deploy(contracts.VerseToken, deployer.address);
  await stakingVault.waitForDeployment();
  contracts.StakingVault = await stakingVault.getAddress();
  console.log("   ✅ StakingVault:", contracts.StakingVault);

  console.log("\n📦 Deploying RewardDistributor...");
  const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
  const rewardDistributor = await RewardDistributor.deploy(contracts.VerseToken, contracts.StakingVault, deployer.address);
  await rewardDistributor.waitForDeployment();
  contracts.RewardDistributor = await rewardDistributor.getAddress();
  console.log("   ✅ RewardDistributor:", contracts.RewardDistributor);

  console.log("\n📦 Deploying Treasury...");
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(deployer.address);
  await treasury.waitForDeployment();
  contracts.Treasury = await treasury.getAddress();
  console.log("   ✅ Treasury:", contracts.Treasury);

  console.log("\n📦 Deploying StrategyManager...");
  const StrategyManager = await ethers.getContractFactory("StrategyManager");
  const strategyManager = await StrategyManager.deploy(deployer.address);
  await strategyManager.waitForDeployment();
  contracts.StrategyManager = await strategyManager.getAddress();
  console.log("   ✅ StrategyManager:", contracts.StrategyManager);

  console.log("\n📦 Deploying OracleManager...");
  const OracleManager = await ethers.getContractFactory("OracleManager");
  const oracleManager = await OracleManager.deploy(deployer.address);
  await oracleManager.waitForDeployment();
  contracts.OracleManager = await oracleManager.getAddress();
  console.log("   ✅ OracleManager:", contracts.OracleManager);

  console.log("\n📦 Deploying EmergencyPause...");
  const EmergencyPause = await ethers.getContractFactory("EmergencyPause");
  const emergencyPause = await EmergencyPause.deploy(deployer.address);
  await emergencyPause.waitForDeployment();
  contracts.EmergencyPause = await emergencyPause.getAddress();
  console.log("   ✅ EmergencyPause:", contracts.EmergencyPause);

  console.log("\n📦 Deploying WithdrawalManager...");
  const WithdrawalManager = await ethers.getContractFactory("WithdrawalManager");
  const withdrawalManager = await WithdrawalManager.deploy(contracts.VerseToken, deployer.address);
  await withdrawalManager.waitForDeployment();
  contracts.WithdrawalManager = await withdrawalManager.getAddress();
  console.log("   ✅ WithdrawalManager:", contracts.WithdrawalManager);

  console.log("\n═══════════════════════════════════════════");
  console.log("  ✅ ALL 8 CONTRACTS DEPLOYED");
  console.log("═══════════════════════════════════════════");
  for (const [name, addr] of Object.entries(contracts)) {
    console.log(`  ${name}: ${addr}`);
  }

  const fs = require("fs");
  const path = require("path");
  const envPath = path.join(__dirname, "../../.env");
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const map = {
    VERSE_TOKEN_ADDRESS: contracts.VerseToken,
    STAKING_VAULT_ADDRESS: contracts.StakingVault,
    REWARD_DISTRIBUTOR_ADDRESS: contracts.RewardDistributor,
    TREASURY_ADDRESS: contracts.Treasury,
    STRATEGY_MANAGER_ADDRESS: contracts.StrategyManager,
    ORACLE_MANAGER_ADDRESS: contracts.OracleManager,
    EMERGENCY_PAUSE_ADDRESS: contracts.EmergencyPause,
    WITHDRAWAL_MANAGER_ADDRESS: contracts.WithdrawalManager,
    CHAIN_ID: "7707",
    CHAIN_RPC: "http://127.0.0.1:8545",
  };
  for (const [k, v] of Object.entries(map)) {
    const re = new RegExp(`^${k}=.*$`, "m");
    env = re.test(env) ? env.replace(re, `${k}=${v}`) : env + `\n${k}=${v}`;
  }
  fs.writeFileSync(envPath, env.trim() + "\n");
  console.log("\n📝 Addresses saved to .env");
}

main().then(() => process.exit(0)).catch(e => { console.error("❌", e.message || e); process.exit(1); });