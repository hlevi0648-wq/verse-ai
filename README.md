# Verse AI - DeFi Staking Protocol

A comprehensive, auditable DeFi protocol with stake-based yield farming and AI-driven portfolio optimization.

## Architecture

### Smart Contracts
- **VerseToken.sol** - ERC-20 governance token with voting
- **StakingVault.sol** - User stake accounting with 7-day unbonding
- **RewardDistributor.sol** - Proportional reward distribution
- **Treasury.sol** - Multi-sig fund management with strategy limits
- **StrategyManager.sol** - Registry of approved yield strategies
- **OracleManager.sol** - Chainlink price feed integration
- **EmergencyPause.sol** - Emergency protocol pause mechanism

### AI Backend
- **strategy.py** - Portfolio optimization via efficient frontier
- **risk.py** - Real-time risk monitoring and constraint enforcement
- **rebalance.py** - Autonomous rebalancing transactions

### Backend API
- **FastAPI** - RESTful endpoints for protocol metrics and portfolio data

## Quick Start

```bash
# Install Node dependencies
npm install

# Install Python dependencies
cd backend
pip install -r requirements.txt

# Set environment
cp ../.env.example ../.env

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

## Key Features

✅ **Proportional Rewards** - Distribution from real protocol yields
✅ **Decentralized Governance** - Token-holder voting with 2-day timelock
✅ **Risk Constraints** - Max 20% drawdown, 50% concentration per strategy
✅ **AI Rebalancing** - Autonomous portfolio optimization
✅ **Emergency Pause** - Pause protocol during incidents
✅ **Oracle Integration** - Chainlink price feeds with staleness checks

## Reward Model

Rewards come from three sources:

1. **Protocol Yields** - Returns from DeFi strategies (Aave, Curve, etc.)
2. **Treasury Appreciation** - Protocol fee accumulation and growth
3. **Rebalancing Alpha** - Performance from AI-driven allocation optimization

**⚠️ No artificial APY guarantees. Rewards reflect actual earned yields.**

## Risk Constraints

The protocol enforces strict risk limits to protect capital:

- **Max Drawdown**: 20% (escalating alerts above threshold)
- **Max Concentration**: 50% per strategy
- **Max Liquidation Risk**: 10%
- **Rebalance Frequency**: Minimum 1 hour between rebalances

## Security Checklist

- ✅ OpenZeppelin audited contracts
- ✅ Slither static analysis (CI/CD)
- ✅ Mythril dynamic analysis
- ✅ 2-day Timelock on governance
- ✅ Emergency pause mechanism
- ✅ ReentrancyGuard on all state-changing functions
- ✅ Access control via OpenZeppelin roles

## API Endpoints

### Health Check
```bash
GET /health
```

### Get User Portfolio
```bash
GET /api/v1/portfolio/{user_address}
Response: { total_staked, total_rewards, pending_rewards, ... }
```

### Get Protocol Statistics
```bash
GET /api/v1/stats
Response: { total_tvl, total_staked, active_strategies, average_apy, ... }
```

## Deployment

```bash
# Testnet (Sepolia)
npm run deploy:sepolia

# Mainnet (Base)
npm run deploy:base

# Mainnet (Arbitrum)
npm run deploy:arbitrum
```

## Contributing

Contributions welcome! Please ensure:
- All tests pass (`npm test`)
- New contracts have 100% test coverage
- Security analysis passes (`npm run slither`)
- Code follows Solidity style guide

## License

MIT

## Disclaimer

This protocol is provided as-is. DeFi carries inherent risks including smart contract bugs, protocol exploits, and market volatility. Always conduct due diligence before investing. **No returns are guaranteed.**
