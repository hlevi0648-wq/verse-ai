import asyncio
import logging
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import aiohttp

logger = logging.getLogger(__name__)

COINGECKO_BASE = "https://api.coingecko.com/api/v3"

VERSE_TOKENS = {
    "ethereum": {"id": "ethereum", "symbol": "ETH", "name": "Ethereum"},
    "bitcoin": {"id": "bitcoin", "symbol": "BTC", "name": "Bitcoin"},
    "usd-coin": {"id": "usd-coin", "symbol": "USDC", "name": "USD Coin"},
    "chainlink": {"id": "chainlink", "symbol": "LINK", "name": "Chainlink"},
    "aave": {"id": "aave", "symbol": "AAVE", "name": "Aave"},
    "uniswap": {"id": "uniswap", "symbol": "UNI", "name": "Uniswap"},
    "lido-dao": {"id": "lido-dao", "symbol": "LDO", "name": "Lido DAO"},
}


class PriceFeed:
    def __init__(self, cache_ttl: int = 60):
        self.cache_ttl = cache_ttl
        self._cache: Dict[str, dict] = {}
        self._last_fetch: Optional[datetime] = None

    async def _fetch_coingecko(self, token_ids: List[str]) -> Dict[str, dict]:
        url = f"{COINGECKO_BASE}/simple/price"
        params = {
            "ids": ",".join(token_ids),
            "vs_currencies": "usd",
            "include_24hr_change": "true",
            "include_24hr_vol": "true",
            "include_market_cap": "true",
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    logger.warning(f"CoinGecko returned {resp.status}")
        except asyncio.TimeoutError:
            logger.warning("CoinGecko request timed out")
        except Exception as e:
            logger.error(f"CoinGecko error: {e}")
        return {}

    async def get_all_prices(self) -> List[dict]:
        now = datetime.now()
        if self._cache and self._last_fetch and (now - self._last_fetch).seconds < self.cache_ttl:
            return list(self._cache.values())

        token_ids = list(VERSE_TOKENS.keys())
        raw = await self._fetch_coingecko(token_ids)

        results = []
        for token_id, meta in VERSE_TOKENS.items():
            data = raw.get(token_id, {})
            price_data = {
                "token": meta["symbol"],
                "name": meta["name"],
                "price_usd": data.get("usd", 0.0),
                "change_24h": data.get("usd_24h_change", 0.0),
                "volume_24h": data.get("usd_24h_vol", 0.0),
                "market_cap": data.get("usd_market_cap", 0.0),
                "timestamp": now.isoformat(),
            }
            results.append(price_data)
            self._cache[meta["symbol"]] = price_data

        self._last_fetch = now
        return results

    async def get_price(self, token: str) -> dict:
        token_lower = token.lower()
        for token_id, meta in VERSE_TOKENS.items():
            if meta["symbol"].lower() == token_lower or token_id == token_lower:
                if meta["symbol"] in self._cache and self._last_fetch:
                    now = datetime.now()
                    if (now - self._last_fetch).seconds < self.cache_ttl:
                        return self._cache[meta["symbol"]]
                raw = await self._fetch_coingecko([token_id])
                data = raw.get(token_id, {})
                return {
                    "token": meta["symbol"],
                    "name": meta["name"],
                    "price_usd": data.get("usd", 0.0),
                    "change_24h": data.get("usd_24h_change", 0.0),
                    "volume_24h": data.get("usd_24h_vol", 0.0),
                    "market_cap": data.get("usd_market_cap", 0.0),
                    "timestamp": datetime.now().isoformat(),
                }
        return {"token": token.upper(), "price_usd": 0.0, "change_24h": 0.0, "volume_24h": 0.0, "market_cap": 0.0, "timestamp": datetime.now().isoformat()}
