from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Verse AI Protocol",
    description="DeFi staking and yield optimization protocol",
    version="1.0.0",
)

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

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/v1/portfolio/{user_address}")
async def get_portfolio(user_address: str):
    return {
        "user_address": user_address,
        "total_staked": 10000.0,
        "total_rewards": 250.0,
        "pending_rewards": 50.0,
    }

@app.get("/api/v1/stats")
async def get_protocol_stats():
    return {
        "total_tvl": 50000000.0,
        "total_staked": 30000000.0,
        "active_strategies": 5,
        "average_apy": 6.5,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
