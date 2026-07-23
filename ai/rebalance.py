import logging
from typing import List, Dict
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class RebalanceTransaction:
    strategy: str
    action: str
    amount: float
    reason: str
    timestamp: datetime
    status: str

class Rebalancer:
    def __init__(self, max_rebalance_frequency: int = 3600):
        self.max_rebalance_frequency = max_rebalance_frequency
        self.last_rebalance = 0
        self.transaction_history: List[RebalanceTransaction] = []

    def generate_rebalance_transactions(
        self,
        current_allocations: Dict[str, float],
        target_allocations: Dict[str, float],
        total_value: float,
        max_transaction_size: float,
    ) -> List[RebalanceTransaction]:
        transactions = []
        current_time = datetime.now()

        for strategy, target_amount in target_allocations.items():
            current_amount = current_allocations.get(strategy, 0)
            delta = target_amount - current_amount

            if abs(delta) < 1.0:
                continue

            action = "allocate" if delta > 0 else "deallocate"
            num_transactions = max(1, int(abs(delta) / max_transaction_size))
            amount_per_tx = abs(delta) / num_transactions

            for i in range(num_transactions):
                tx = RebalanceTransaction(
                    strategy=strategy,
                    action=action,
                    amount=amount_per_tx,
                    reason=f"Rebalance to target",
                    timestamp=current_time,
                    status="pending",
                )
                transactions.append(tx)

        return transactions
