import logging
from typing import Dict, List
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class RiskAlert(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

@dataclass
class RiskMetrics:
    total_value: float
    unrealized_loss: float
    drawdown_percent: float
    concentration: Dict[str, float]
    liquidation_risk: float
    alerts: List[str]

class RiskManager:
    def __init__(
        self,
        max_drawdown: float = 0.20,
        max_concentration: float = 0.50,
        max_liquidation_risk: float = 0.10,
    ):
        self.max_drawdown = max_drawdown
        self.max_concentration = max_concentration
        self.max_liquidation_risk = max_liquidation_risk
        self.peak_value = 0.0

    def calculate_metrics(
        self,
        current_portfolio_value: float,
        positions: Dict[str, Dict],
        past_values: List[float],
    ) -> RiskMetrics:
        if current_portfolio_value > self.peak_value:
            self.peak_value = current_portfolio_value

        drawdown = 1.0 - (current_portfolio_value / self.peak_value) if self.peak_value > 0 else 0
        unrealized_loss = self.peak_value - current_portfolio_value

        concentration = {}
        for strategy_name, position in positions.items():
            if "value" in position:
                concentration[strategy_name] = position["value"] / current_portfolio_value

        liquidation_risk = self._calculate_liquidation_risk(positions)
        alerts = self._check_constraints(drawdown, concentration, liquidation_risk)

        return RiskMetrics(
            total_value=current_portfolio_value,
            unrealized_loss=unrealized_loss,
            drawdown_percent=drawdown * 100,
            concentration=concentration,
            liquidation_risk=liquidation_risk,
            alerts=alerts,
        )

    def _calculate_liquidation_risk(self, positions: Dict[str, Dict]) -> float:
        total_exposed = sum(p.get("value", 0) for p in positions.values())
        high_risk_value = sum(
            p.get("value", 0)
            for p in positions.values()
            if p.get("risk_score", 50) > 75
        )
        if total_exposed == 0:
            return 0.0
        return min(high_risk_value / total_exposed, 1.0)

    def _check_constraints(
        self,
        drawdown: float,
        concentration: Dict[str, float],
        liquidation_risk: float,
    ) -> List[str]:
        alerts = []
        if drawdown > self.max_drawdown:
            alerts.append(f"WARNING: Drawdown {drawdown*100:.2f}% exceeds limit")
        for strategy, weight in concentration.items():
            if weight > self.max_concentration:
                alerts.append(f"WARNING: {strategy} concentration too high")
        if liquidation_risk > self.max_liquidation_risk:
            alerts.append(f"WARNING: Liquidation risk too high")
        return alerts
