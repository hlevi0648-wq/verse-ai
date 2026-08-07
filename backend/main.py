from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import os
import logging
import asyncio
from dotenv import load_dotenv
from web3 import Web3
import json

from ai.strategy import PortfolioStrategy, StrategyMetrics
from ai.risk import RiskManager, RiskMetrics
from ai.price_feed import PriceFeed
from ai.oracle_reader import OracleReader

load_dotenv()

logger = logging.getLogger(__name__)

RPC_URL = os.getenv("SEPOLIA_RPC_URL", "http://127.0.0.1:8545")
w3 = Web3(Web3.HTTPProvider(RPC_URL))

CONTRACT_ADDRESSES = {
    "verse_token": os.getenv("VERSE_TOKEN_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3"),
    "staking_vault": os.getenv("STAKING_VAULT_ADDRESS", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"),
    "reward_distributor": os.getenv("REWARD_DISTRIBUTOR_ADDRESS", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"),
    "treasury": os.getenv("TREASURY_ADDRESS", "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"),
    "strategy_manager": os.getenv("STRATEGY_MANAGER_ADDRESS", "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"),
    "oracle_manager": os.getenv("ORACLE_MANAGER_ADDRESS", "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"),
    "emergency_pause": os.getenv("EMERGENCY_PAUSE_ADDRESS", "0x0165878A594ca255338adfa4d48449f69242Eb8F"),
}

VERSE_TOKEN_ABI = json.loads('[{"name":"totalSupply","inputs":[],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"name":"balanceOf","inputs":[{"name":"account","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]')

STAKING_VAULT_ABI = json.loads('[{"name":"totalStaked","inputs":[],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"name":"stakedBalanceOf","inputs":[{"name":"account","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"name":"earnedRewards","inputs":[{"name":"account","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"name":"paused","inputs":[],"outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"}]')

REWARD_DISTRIBUTOR_ABI = json.loads('[{"name":"rewardRate","inputs":[],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"name":"totalDistributed","inputs":[],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]')

STRATEGY_MANAGER_ABI = json.loads('[{"name":"getAllStrategies","inputs":[],"outputs":[{"name":"","type":"tuple[]","components":[{"name":"strategyAddress","type":"address"},{"name":"name","type":"string"},{"name":"description","type":"string"},{"name":"isActive","type":"bool"},{"name":"maxAllocation","type":"uint256"},{"name":"currentAllocation","type":"uint256"},{"name":"apy","type":"uint256"},{"name":"riskScore","type":"uint256"},{"name":"yieldToken","type":"address"}]}],"stateMutability":"view","type":"function"}]')

EMERGENCY_PAUSE_ABI = json.loads('[{"name":"isPaused","inputs":[],"outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"}]')


def get_contract(address, abi):
    if not address or not w3.is_address(address):
        return None
    return w3.eth.contract(address=Web3.to_checksum_address(address), abi=abi)


def from_wei(value):
    return value / 1e18


app = FastAPI(title="Verse AI Protocol", description="AI-powered DeFi staking and yield optimization", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*""],
    allow_headers=["*"],
)

price_feed = PriceFeed()
oracle_reader = OracleReader(rpc_url=RPC_URL)


class PriceData(BaseModel):
    token: str
    price_usd: float
    change_24h: float
    volume_24h: float
    market_cap: float
    timestamp: str


class PortfolioMetrics(BaseModel):
    user_address: str
    total_staked: float
    total_rewards: float
    pending_rewards: float
    portfolio_value_usd: float


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


class Recommendation(BaseModel):
    strategy_name: str
    action: str
    allocation_percent: float
    reason: str
    confidence: float


class AnalyticsData(BaseModel):
    total_tvl: float
    total_staked: float
    total_rewards: float
    verse_price: float
    eth_price: float
    avg_apy: float
    risk_score: float
    sharpe_ratio: float
    strategies_count: int


@app.get("/health")
async def health_check():
    connected = w3.is_connected()
    return {
        "status": "healthy" if connected else "degraded",
        "web3_connected": connected,
        "chain_id": w3.eth.chain_id if connected else None,
        "block_number": w3.eth.block_number if connected else None,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/v1/prices", response_model=List[PriceData])
async def get_prices():
    try:
        prices = await price_feed.get_all_prices()
        return prices
    except Exception as e:
        logger.error(f"Price fetch error: {e}")
        raise HTTPException(status_code=503, detail="Price feed unavailable")


@app.get("/api/v1/prices/{token}")
async def get_token_price(token: str):
    try:
        price = await price_feed.get_price(token.lower())
        return price
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Token {token} not found")


@app.get("/api/v1/analytics", response_model=AnalyticsData)
async def get_analytics():
    total_staked = 0.0
    total_distributed = 0.0
    total_supply = 0.0

    vault = get_contract(CONTRACT_ADDRESSES["staking_vault"], STAKING_VAULT_ABI)
    if vault:
        try:
            total_staked = from_wei(vault.functions.totalStaked().call())
        except Exception:
            pass

    distributor = get_contract(CONTRACT_ADDRESSES["reward_distributor"], REWARD_DISTRIBUTOR_ABI)
    if distributor:
        try:
            total_distributed = from_wei(distributor.functions.totalDistributed().call())
        except Exception:
            pass

    token = get_contract(CONTRACT_ADDRESSES["verse_token"], VERSE_TOKEN_ABI)
    if token:
        try:
            total_supply = from_wei(token.functions.totalSupply().call())
        except Exception:
            pass

    try:
        verse_price = await price_feed.get_price("verse")
        verse_usd = verse_price.get("price_usd", 0.0)
    except Exception:
        verse_usd = 0.0

    try:
        eth_price = await price_feed.get_price("ethereum")
        eth_usd = eth_price.get("price_usd", 0.0)
    except Exception:
        eth_usd = 0.0

    sm = get_contract(CONTRACT_ADDRESSES["strategy_manager"], STRATEGY_MANAGER_ABI)
    strategies = []
    if sm:
        try:
            raw = sm.functions.getAllStrategies().call()
            strategies = [s for s in raw if s[3]]  # active only
        except Exception:
            pass

    avg_apy = sum(float(s[6]) / 100.0 for s in strategies) / len(strategies) if strategies else 0.0
    avg_risk = sum(float(s[7]) for s in strategies) / len(strategies) if strategies else 0.0

    sharpe = 0.0
    if avg_apy > 0 and avg_risk > 0:
        sharpe = (avg_apy - 0.04) / (avg_risk / 100.0)  # risk-free rate ~4%

    return AnalyticsData(
        total_tvl=total_supply * verse_usd,
        total_staked=total_staked,
        total_rewards=total_distributed,
        verse_price=verse_usd,
        eth_price=eth_usd,
        avg_apy=avg_apy,
        risk_score=avg_risk,
        sharpe_ratio=sharpe,
        strategies_count=len(strategies),
    )


@app.get("/api/v1/portfolio/{user_address}", response_model=PortfolioMetrics)
async def get_portfolio(user_address: str):
    try:
        checksum = Web3.to_checksum_address(user_address)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid address")

    total_staked = 0.0
    pending = 0.0
    claimed = 0.0

    vault = get_contract(CONTRACT_ADDRESSES["staking_vault"], STAKING_VAULT_ABI)
    if vault:
        try:
            total_staked = from_wei(vault.functions.stakedBalanceOf(checksum).call())
            pending = from_wei(vault.functions.earnedRewards(checksum).call())
        except Exception:
            pass

    try:
        verse_price = await price_feed.get_price("verse")
        verse_usd = verse_price.get("price_usd", 0.0)
    except Exception:
        verse_usd = 0.0

    return PortfolioMetrics(
        user_address=user_address,
        total_staked=total_staked,
        total_rewards=claimed,
        pending_rewards=pending,
        portfolio_value_usd=total_staked * verse_usd,
    )


@app.get("/api/v1/stats")
async def get_protocol_stats():
    total_staked = 0.0
    total_distributed = 0.0
    total_supply = 0.0

    vault = get_contract(CONTRACT_ADDRESSES["staking_vault"], STAKING_VAULT_ABI)
    if vault:
        try:
            total_staked = from_wei(vault.functions.totalStaked().call())
        except Exception:
            pass

    distributor = get_contract(CONTRACT_ADDRESSES["reward_distributor"], REWARD_DISTRIBUTOR_ABI)
    if distributor:
        try:
            total_distributed = from_wei(distributor.functions.totalDistributed().call())
        except Exception:
            pass

    token = get_contract(CONTRACT_ADDRESSES["verse_token"], VERSE_TOKEN_ABI)
    if token:
        try:
            total_supply = from_wei(token.functions.totalSupply().call())
        except Exception:
            pass

    return {
        "total_tvl": total_supply,
        "total_staked": total_staked,
        "total_rewards_distributed": total_distributed,
        "active_strategies": 0,
        "average_apy": 0.0,
    }


@app.get("/api/v1/strategies", response_model=List[StrategyInfo])
async def get_strategies():
    sm = get_contract(CONTRACT_ADDRESSES["strategy_manager"], STRATEGY_MANAGER_ABI)
    if not sm:
        return []
    try:
        raw = sm.functions.getAllStrategies().call()
        strategies = []
        for s in raw:
            strategies.append(StrategyInfo(
                address=s[0], name=s[1], description=s[2],
                is_active=s[3], max_allocation=from_wei(s[4]),
                current_allocation=from_wei(s[5]),
                apy=float(s[6]) / 100.0, risk_score=float(s[7]),
                yield_token=s[8],
            ))
        return strategies
    except Exception as e:
        logger.warning(f"Failed to read strategies: {e}")
        return []


@app.get("/api/v1/recommendations", response_model=List[Recommendation])
async def get_recommendations(risk_tolerance: Optional[str] = "medium"):
    sm = get_contract(CONTRACT_ADDRESSES["strategy_manager"], STRATEGY_MANAGER_ABI)
    if not sm:
        return []

    try:
        raw = sm.functions.getAllStrategies().call()
        metrics = [
            StrategyMetrics(
                name=s[1], apy=float(s[6]) / 100.0, risk_score=float(s[7]),
                tvl=from_wei(s[5]), max_allocation=from_wei(s[4]),
                current_allocation=from_wei(s[5]),
                yield_token=s[8], protocol=s[2],
            )
            for s in raw if s[3]
        ]
    except Exception:
        return []

    if not metrics:
        return []

    total_capital = sum(m.current_allocation for m in metrics)
    optimizer = PortfolioStrategy(total_capital=total_capital)
    allocations = optimizer.optimize_allocation(metrics)

    risk_map = {"low": 30, "medium": 60, "high": 90}
    max_risk = risk_map.get(risk_tolerance, 60)

    recommendations = []
    for name, amount in allocations.items():
        strat = next((m for m in metrics if m.name == name), None)
        if not strat:
            continue
        pct = (amount / total_capital * 100) if total_capital > 0 else 0
        if strat.risk_score > max_risk:
            action = "reduce"
            reason = f"Risk score {strat.risk_score} exceeds tolerance {max_risk}"
            confidence = 0.9
        elif pct > 30:
            action = "hold"
            reason = f"Well-allocated at {pct:.1f}%"
            confidence = 0.7
        else:
            action = "increase"
            reason = f"Under-allocated at {pct:.1f}%, good risk-adjusted return"
            confidence = 0.8
        recommendations.append(Recommendation(
            strategy_name=name, action=action,
            allocation_percent=pct, reason=reason,
            confidence=confidence,
        ))

    return recommendations


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
            total_distributed = from_wei(distributor.functions.totalDistributed().call())
        except Exception:
            pass

    return RiskStatus(
        protocol_paused=paused, total_tvl=total_staked,
        total_staked=total_staked,
        total_rewards_distributed=total_distributed,
    )


@app.get("/api/v1/oracle/prices")
async def get_oracle_prices():
    try:
        prices = oracle_reader.get_all_prices()
        return prices
    except Exception as e:
        logger.error(f"Oracle read error: {e}")
        raise HTTPException(status_code=503, detail="Oracle unavailable")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
