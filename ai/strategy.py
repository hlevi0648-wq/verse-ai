import logging
from typing import List, Dict, Tuple
from dataclasses import dataclass
from enum import Enum
import numpy as np

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

        risks = np.array([s.risk_score / 100.0 for s in strategies])
        returns = np.array([s.apy / 100.0 for s in strategies])

        n_points = 50
        frontier = []
        min_risk_idx = np.argmin(risks)
        max_return_idx = np.argmax(returns)

        for i in range(n_points):
            t = i / (n_points - 1)
            w_min = 1 - t
            w_max = t
            blended_risk = w_min * risks[min_risk_idx] + w_max * risks[max_return_idx]
            blended_return = w_min * returns[min_risk_idx] + w_max * returns[max_return_idx]
            frontier.append((float(blended_risk), float(blended_return)))

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

        risks = np.array([s.risk_score + 1 for s in active])
        returns = np.array([s.apy for s in active])

        # Sharpe-ratio weighted allocation
        risk_free = 4.0  # ~4% risk-free rate
        excess_returns = np.maximum(returns - risk_free, 0.01)
        sharpe_weights = excess_returns / risks
        total_weight = np.sum(sharpe_weights)

        if total_weight == 0:
            # Fallback to inverse risk
            inverse_risks = 1.0 / risks
            total_inverse = np.sum(inverse_risks)
            weights = inverse_risks / total_inverse
        else:
            weights = sharpe_weights / total_weight

        allocations = {}
        for strategy, weight in zip(active, weights):
            allocation = float(weight) * self.total_capital
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
                weight = self.allocations[strategy.name] / self.total_capital
                weighted_apy += weight * strategy.apy
        return weighted_apy

    def get_portfolio_risk(self, strategies: List[StrategyMetrics]) -> float:
        if not self.allocations:
            return 0.0

        weighted_risk = 0.0
        for strategy in strategies:
            if strategy.name in self.allocations:
                weight = self.allocations[strategy.name] / self.total_capital
                weighted_risk += weight * strategy.risk_score
        return weighted_risk

    def get_sharpe_ratio(self, strategies: List[StrategyMetrics], risk_free_rate: float = 4.0) -> float:
        apy = self.get_weighted_apy(strategies)
        risk = self.get_portfolio_risk(strategies)
        if risk == 0:
            return 0.0
        return (apy - risk_free_rate) / (risk / 100.0)
