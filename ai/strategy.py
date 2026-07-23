import logging
from typing import List, Dict, Tuple
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

@dataclass
class StrategyMetrics:
    name: str
    apy: float
    risk_score: float
    tvl: float
    max_allocation: float
    current_allocation: float
    yield_token: str
    protocol: str

class PortfolioStrategy:
    def __init__(self, total_capital: float, max_drawdown: float = 0.20):
        self.total_capital = total_capital
        self.max_drawdown = max_drawdown
        self.allocations: Dict[str, float] = {}

    def calculate_efficient_frontier(
        self, strategies: List[StrategyMetrics]
    ) -> List[Tuple[float, float]]:
        if not strategies:
            return []

        frontier = []
        for strategy in strategies:
            normalized_risk = strategy.risk_score / 100.0
            expected_return = strategy.apy / 100.0
            frontier.append((normalized_risk, expected_return))
        return frontier

    def optimize_allocation(
        self, strategies: List[StrategyMetrics]
    ) -> Dict[str, float]:
        if not strategies:
            return {}

        active = [s for s in strategies if s.current_allocation < s.max_allocation]
        if not active:
            logger.warning("No active strategies available")
            return {}

        inverse_risks = [1.0 / (s.risk_score + 1) for s in active]
        total_inverse_risk = sum(inverse_risks)

        allocations = {}
        for strategy, inv_risk in zip(active, inverse_risks):
            allocation = (inv_risk / total_inverse_risk) * self.total_capital
            if allocation > strategy.max_allocation:
                allocation = strategy.max_allocation
            allocations[strategy.name] = allocation

        self.allocations = allocations
        return allocations

    def get_weighted_apy(self, strategies: List[StrategyMetrics]) -> float:
        if not self.allocations:
            return 0.0

        weighted_apy = 0.0
        for strategy in strategies:
            if strategy.name in self.allocations:
                allocation = self.allocations[strategy.name]
                weight = allocation / self.total_capital
                weighted_apy += weight * (strategy.apy / 100.0)

        return weighted_apy * 100
