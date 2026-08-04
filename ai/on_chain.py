import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from web3 import Web3
import os
import json
from dotenv import load_dotenv

from ai.strategy import PortfolioStrategy, StrategyMetrics
from ai.risk import RiskManager

load_dotenv()

logger = logging.getLogger(__name__)


STRATEGY_MANAGER_ABI = json.loads('[{"name":"getAllStrategies","inputs":[],"outputs":[{"name":"","type":"tuple[]","components":[{"name":"strategyAddress","type":"address"},{"name":"name","type":"string"},{"name":"description","type":"string"},{"name":"isActive","type":"bool"},{"name":"maxAllocation","type":"uint256"},{"name":"currentAllocation","type":"uint256"},{"name":"apy","type":"uint256"},{"name":"riskScore","type":"uint256"},{"name":"yieldToken","type":"address"}]}],"stateMutability":"view","type":"function"},{"name":"updateAllocation","inputs":[{"name":"strategyAddress","type":"address"},{"name":"newAllocation","type":"uint256"}],"outputs":[],"stateMutability":"nonpayable","type":"function"}]')

STAKING_VAULT_ABI = json.loads('[{"name":"totalStaked","inputs":[],"outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]')


def from_wei(value):
    return value / 1e18


def to_wei(value):
    return int(value * 1e18)


@dataclass
class OnChainStrategy:
    address: str
    name: str
    description: str
    is_active: bool
    max_allocation: float
    current_allocation: float
    apy: float
    risk_score: float
    yield_token: str


class OnChainReader:
    """Reads on-chain state from Verse AI contracts."""

    def __init__(self, rpc_url=None):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url or os.getenv("SEPOLIA_RPC_URL", "http://127.0.0.1:8545")))
        self.strategy_manager_addr = os.getenv("STRATEGY_MANAGER_ADDRESS", "")
        self.staking_vault_addr = os.getenv("STAKING_VAULT_ADDRESS", "")

    def get_strategies(self) -> List[OnChainStrategy]:
        if not self.strategy_manager_addr:
            logger.warning("STRATEGY_MANAGER_ADDRESS not set")
            return []

        contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(self.strategy_manager_addr),
            abi=STRATEGY_MANAGER_ABI,
        )

        try:
            raw = contract.functions.getAllStrategies().call()
            strategies = []
            for s in raw:
                strategies.append(OnChainStrategy(
                    address=s[0], name=s[1], description=s[2],
                    is_active=s[3], max_allocation=from_wei(s[4]),
                    current_allocation=from_wei(s[5]), apy=float(s[6]) / 100.0,
                    risk_score=float(s[7]), yield_token=s[8],
                ))
            return strategies
        except Exception as e:
            logger.error(f"Failed to fetch strategies: {e}")
            return []

    def get_total_staked(self) -> float:
        if not self.staking_vault_addr:
            return 0.0

        contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(self.staking_vault_addr),
            abi=STAKING_VAULT_ABI,
        )

        try:
            return from_wei(contract.functions.totalStaked().call())
        except Exception as e:
            logger.error(f"Failed to fetch totalStaked: {e}")
            return 0.0


class OnChainRebalanceExecutor:
    """Executes rebalance transactions on-chain via StrategyManager.updateAllocation."""

    def __init__(self, rpc_url=None, private_key=None):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url or os.getenv("SEPOLIA_RPC_URL", "http://127.0.0.1:8545")))
        self.private_key = private_key or os.getenv("PRIVATE_KEY", "")
        self.strategy_manager_addr = os.getenv("STRATEGY_MANAGER_ADDRESS", "")

    def execute_rebalance(self, target_allocations: Dict[str, float]) -> List[str]:
        if not self.private_key:
            logger.error("No private key configured for transactions")
            return []

        if not self.strategy_manager_addr:
            logger.error("STRATEGY_MANAGER_ADDRESS not set")
            return []

        contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(self.strategy_manager_addr),
            abi=STRATEGY_MANAGER_ABI,
        )

        account = self.w3.eth.account.from_key(self.private_key)
        tx_hashes = []

        for strategy_addr, allocation in target_allocations.items():
            try:
                nonce = self.w3.eth.get_transaction_count(account.address)
                tx = contract.functions.updateAllocation(
                    Web3.to_checksum_address(strategy_addr),
                    to_wei(allocation),
                ).build_transaction({
                    "from": account.address,
                    "nonce": nonce,
                    "gas": 200000,
                    "gasPrice": self.w3.eth.gas_price,
                })

                signed = account.sign_transaction(tx)
                tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

                if receipt.status == 1:
                    tx_hashes.append(tx_hash.hex())
                    logger.info(f"Rebalance tx confirmed: {tx_hash.hex()}")
                else:
                    logger.error(f"Rebalance tx reverted: {tx_hash.hex()}")

            except Exception as e:
                logger.error(f"Failed to rebalance {strategy_addr}: {e}")

        return tx_hashes


def run_ai_cycle():
    """Full AI cycle: read on-chain state -> optimize -> check risk -> execute rebalance."""
    reader = OnChainReader()
    executor = OnChainRebalanceExecutor()

    on_chain = reader.get_strategies()
    if not on_chain:
        logger.warning("No strategies found on-chain")
        return

    metrics = [
        StrategyMetrics(
            name=s.name, apy=s.apy, risk_score=s.risk_score,
            tvl=s.current_allocation, max_allocation=s.max_allocation,
            current_allocation=s.current_allocation,
            yield_token=s.yield_token, protocol=s.description,
        )
        for s in on_chain if s.is_active
    ]

    total_capital = reader.get_total_staked()
    optimizer = PortfolioStrategy(total_capital=total_capital)
    allocations = optimizer.optimize_allocation(metrics)

    if not allocations:
        logger.warning("No allocation produced")
        return

    positions = {
        s.name: {"value": s.current_allocation, "risk_score": s.risk_score}
        for s in on_chain if s.is_active
    }
    risk_mgr = RiskManager()
    risk = risk_mgr.calculate_metrics(total_capital, positions, [total_capital])

    if risk.alerts:
        logger.warning(f"Risk alerts: {risk.alerts}")
        if risk.drawdown_percent > 20.0:
            logger.error("Drawdown exceeds 20% - skipping rebalance")
            return

    name_to_addr = {s.name: s.address for s in on_chain}
    target_allocations = {
        name_to_addr[name]: amount
        for name, amount in allocations.items()
        if name in name_to_addr
    }

    tx_hashes = executor.execute_rebalance(target_allocations)
    logger.info(f"Rebalance complete. TXs: {tx_hashes}")
    return tx_hashes


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_ai_cycle()
