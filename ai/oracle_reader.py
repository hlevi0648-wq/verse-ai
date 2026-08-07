import logging
from typing import Dict, Optional
from web3 import Web3
import os
import json

logger = logging.getLogger(__name__)

# Chainlink price feed addresses on Sepolia
CHAINLINK_FEEDS = {
    "ETH_USD": "0x694AA1769357215DE4FAC081bf1f304aDC103B8",
    "BTC_USD": "0xA39434A0289E7b6c730f9041D7D6e661e8E2873",
    "LINK_USD": "0x48731cF7e84dc00C01D6876A7a4eE0a9dD3Bf60",
    "USDC_USD": "0x572dDec90873058392B7d2422890fE2a3e1e0E74",
}

CHAINLINK_AGGREGATOR_ABI = json.loads('[{"inputs":[],"name":"latestRoundData","outputs":[{"name":"roundId","type":"uint80"},{"name":"answer","type":"int256"},{"name":"startedAt","type":"uint256"},{"name":"updatedAt","type":"uint256"},{"name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"description","outputs":[{"name":"","type":"string"}],"stateMutability":"view","type":"function"}]')


class OracleReader:
    def __init__(self, rpc_url: Optional[str] = None):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url or os.getenv("SEPOLIA_RPC_URL", "http://127.0.0.1:8545")))

    def get_price(self, pair: str) -> Optional[Dict]:
        feed_addr = CHAINLINK_FEEDS.get(pair.upper())
        if not feed_addr:
            logger.warning(f"Unknown pair: {pair}")
            return None

        try:
            contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(feed_addr),
                abi=CHAINLINK_AGGREGATOR_ABI,
            )
            decimals = contract.functions.decimals().call()
            round_data = contract.functions.latestRoundData().call()
            description = contract.functions.description().call()

            price = round_data[1] / (10 ** decimals)
            updated_at = round_data[3]

            return {
                "pair": pair,
                "price": price,
                "decimals": decimals,
                "round_id": round_data[0],
                "updated_at": updated_at,
                "description": description,
                "stale": (self.w3.eth.get_block("latest")["timestamp"] - updated_at) > 3600,
            }
        except Exception as e:
            logger.error(f"Oracle read error for {pair}: {e}")
            return None

    def get_all_prices(self) -> Dict[str, Dict]:
        results = {}
        for pair in CHAINLINK_FEEDS:
            price = self.get_price(pair)
            if price:
                results[pair] = price
        return results
