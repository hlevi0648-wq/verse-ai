from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime
import os
from dotenv import load_dotenv
from web3 import Web3
import json
import logging

load_dotenv()

logger = logging.getLogger(__name__)

RPC_URL = os.getenv("SEPOLIA_RPC_URL", "http://127.0.0.1:8545")
w3 = Web3(Web3.HTTPProvider(RPC_URL))

CONTRACT_ADDRESSES = {
    "verse_token": os.getenv("VERSE_TOKEN_ADDRESS", ""),
    "staking_vault": os.getenv("STAKING_VAULT_ADDRESS", ""),
    "reward_distributor": os.getenv("REWARD_DISTRIBUTOR_ADDRESS", ""),
    "treasury": os.getenv("TREASURY_ADDRESS", ""),
    "strategy_manager": os.getenv("STRATEGY_MANAGER_ADDRESS", ""),
    "oracle_manager": os.getenv("ORACLE_MANAGER_ADDRESS", ""),
    "emergency_pause": os.getenv("EMERGENCY_PAUSE_ADDRESS", ""),
}

VERSE_TOKEN_ABI = json.loads('[{"name":"totalSupply","inputs":[],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"name":"balanceOf","inputs":[{"name":"account","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]')

STAKING_VAULT_ABI = json.loads('[{"name":"totalStaked","inputs":[],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"name":"stakedBalance","inputs":[{"name":"","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]')

REWARD_DISTRIBUTOR_ABI = json.loads('[{"name":"pendingRewards","inputs":[{"name":"user","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"name":"rewardsClaimed","inputs":[{"name":"","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"name":"totalRewardsDistributed","inputs":[],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]')

STRATEGY_MANAGER_ABI = json.loads('[{"name":"getAllStrategies","inputs":[],"outputs":[{"name":"","type":"tuple[]","components":[{"name":"strategyAddress","type":"address"},{"name":"name","type":"string"},{"name":"description","type":"string"},{"name":"isActive","type":"bool"},{"name":"maxAllocation","type":"uint256"},{"name":"currentAllocation","type":"uint256"},{"name":"apy","type":"uint256"},{"name":"riskScore","type":"uint256"},{"name":"yieldToken","type":"address"}]}],"stateMutability":"view","type":"function"}]')

EMERGENCY_PAUSE_ABI = json.loads('[{"name":"isPaused","inputs":[],"outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"}]')


def get_contract(address, abi):
    if not address or not w3.is_address(address):
        return None
    return w3.eth.contract(address=Web3.to_checksum_address(address), abi=abi)


def from_wei(value):
    return value / 1e18


app = FastAPI(title="Verse AI Protocol", description="DeFi staking and yield optimization protocol", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PortfolioMetrics(BaseModel):
    user_address: str
    total_staked: float
    total_rewards: float
    pending_rewards: float


class StrategyInfo(BaseModel):
    address: str
    name: str
    description: str
    is_active: bool
    max_allocation: float
    current_allocation: float
    apy: float
    risk_score: float
    yield_token: str


class RiskStatus(BaseModel):
    protocol_paused: bool
    total_tvl: float
    total_staked: float
    total_rewards_distributed: float


@app.get("/health")
async def health_check():
    connected = w3.is_connected()
    return {"status": "healthy" if connected else "degraded", "web3_connected": connected, "chain_id": w3.eth.chain_id if connected else None, "timestamp": datetime.now().isoformat()}


@app.get("/api/v1/portfolio/{user_address}")
async def get_portfolio(user_address: str):
    try:
        checksum = Web3.to_checksum_address(user_address)
    except ValueError:
        return {"error": "Invalid address"}

    total_staked = 0.0
    pending = 0.0
    claimed = 0.0

    vault = get_contract(CONTRACT_ADDRESSES["staking_vault"], STAKING_VAULT_ABI)
    if vault:
        try:
            total_staked = from_wei(vault.functions.stakedBalance(checksum).call())
        except Exception as e:
            logger.warning(f"Failed to read stakedBalance: {e}")

    distributor = get_contract(CONTRACT_ADDRESSES["reward_distributor"], REWARD_DISTRIBUTOR_ABI)
    if distributor:
        try:
            pending = from_wei(distributor.functions.pendingRewards(checksum).call())
            claimed = from_wei(distributor.functions.rewardsClaimed(checksum).call())
        except Exception as e:
            logger.warning(f"Failed to read rewards: {e}")

    return {"user_address": user_address, "total_staked": total_staked, "total_rewards": claimed, "pending_rewards": pending}


@app.get("/api/v1/stats")
async def get_protocol_stats():
    total_tvl = 0.0
    total_staked = 0.0
    total_distributed = 0.0

    vault = get_contract(CONTRACT_ADDRESSES["staking_vault"], STAKING_VAULT_ABI)
    if vault:
        try:
            total_staked = from_wei(vault.functions.totalStaked().call())
        except Exception as e:
            logger.warning(f"Failed to read totalStaked: {e}")

    distributor = get_contract(CONTRACT_ADDRESSES["reward_distributor"], REWARD_DISTRIBUTOR_ABI)
    if distributor:
        try:
            total_distributed = from_wei(distributor.functions.totalRewardsDistributed().call())
        except Exception as e:
            logger.warning(f"Failed to read totalRewardsDistributed: {e}")

    token = get_contract(CONTRACT_ADDRESSES["verse_token"], VERSE_TOKEN_ABI)
    if token:
        try:
            supply = from_wei(token.functions.totalSupply().call())
            total_tvl = supply
        except Exception as e:
            logger.warning(f"Failed to read totalSupply: {e}")

    return {"total_tvl": total_tvl, "total_staked": total_staked, "total_rewards_distributed": total_distributed, "active_strategies": 0, "average_apy": 0.0}


@app.get("/api/v1/strategies", response_model=List[StrategyInfo])
async def get_strategies():
    sm = get_contract(CONTRACT_ADDRESSES["strategy_manager"], STRATEGY_MANAGER_ABI)
    if not sm:
        return []
    try:
        raw = sm.functions.getAllStrategies().call()
        strategies = []
        for s in raw:
            strategies.append(StrategyInfo(address=s[0], name=s[1], description=s[2], is_active=s[3], max_allocation=from_wei(s[4]), current_allocation=from_wei(s[5]), apy=float(s[6]) / 100.0, risk_score=float(s[7]), yield_token=s[8]))
        return strategies
    except Exception as e:
        logger.warning(f"Failed to read strategies: {e}")
        return []


@app.get("/api/v1/risk", response_model=RiskStatus)
async def get_risk_status():
    paused = False
    total_staked = 0.0
    total_distributed = 0.0

    ep = get_contract(CONTRACT_ADDRESSES["emergency_pause"], EMERGENCY_PAUSE_ABI)
    if ep:
        try:
            paused = ep.functions.isPaused().call()
        except Exception:
            pass

    vault = get_contract(CONTRACT_ADDRESSES["staking_vault"], STAKING_VAULT_ABI)
    if vault:
        try:
            total_staked = from_wei(vault.functions.totalStaked().call())
        except Exception:
            pass

    distributor = get_contract(CONTRACT_ADDRESSES["reward_distributor"], REWARD_DISTRIBUTOR_ABI)
    if distributor:
        try:
            total_distributed = from_wei(distributor.functions.totalRewardsDistributed().call())
        except Exception:
            pass

    return RiskStatus(protocol_paused=paused, total_tvl=total_staked, total_staked=total_staked, total_rewards_distributed=total_distributed)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
