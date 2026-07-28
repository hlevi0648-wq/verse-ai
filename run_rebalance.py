from ai.rebalance import Rebalancer
from pprint import pprint


def main():
    current_allocations = {
        "strategy_a": 50.0,
        "strategy_b": 20.0,
    }
    target_allocations = {
        "strategy_a": 30.0,
        "strategy_b": 40.0,
    }
    total_value = sum(current_allocations.values())
    r = Rebalancer(max_rebalance_frequency=3600)
    txs = r.generate_rebalance_transactions(
        current_allocations,
        target_allocations,
        total_value,
        max_transaction_size=10.0,
    )
    pprint(txs)


if __name__ == "__main__":
    main()
