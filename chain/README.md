# Verse Chain — Custom EVM Blockchain

A custom Ethereum-compatible (EVM) blockchain built with go-ethereum (Geth) using Clique PoA consensus.

## Chain Specs

| Parameter | Value |
|-----------|-------|
| Chain ID | 7707 |
| Consensus | Clique (PoA) |
| Block Time | 5 seconds |
| Gas Limit | 30,000,000 |
| EVM Version | Cancun |
| Sealer | `0xb55b9c54f0897e377b6ab885be56fce37d08546b` |

## Pre-funded Accounts

| Address | Balance |
|---------|--------|
| `0xb55b9c54f0897e377b6ab885be56fce37d08546b` | 2,000,000 ETH |
| `0xb0557906c617f0048a700758606f64b33d0c41a6` | 1,000,000 ETH |

## Quick Start

### Option 1: Docker (Recommended)

```bash
ccd chain
docker-compose up -d
```

Wait ~10 seconds for the sealer to start mining, then:

```bash
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Option 2: Local Geth

```bash
# Install geth (macOS)
brew install ethereum

# Install geth (Ubuntu)
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt-get update && sudo apt-get install geth

# Initialize chain
geth init --datadir ./data ./genesis.json

# Start sealer
geth --datadir ./data \
  --mine \
  --miner.etherbase=0xb55b9c54f0897e377b6ab885be56fce37d08546b \
  --http --http.addr=0.0.0.0 --http.port=8545 \
  --http.api=eth,net,web3,txpool,debug,admin,personal \
  --http.corsdomain="*" \
  --ws --ws.addr=0.0.0.0 --ws.port=8546 \
  --networkid=7707 --syncmode=full
```

## Deploy Contracts

```bash
# From repo root
npm install
npx hardhat compile
npx hardhat run chain/scripts/deploy.js --network verse
```

## Add to MetaMask

| Field | Value |
|-------|-------|
| Network Name | Verse Chain |
| RPC URL | http://127.0.0.1:8545 |
| Chain ID | 7707 |
| Currency Symbol | ETH |
| Block Explorer | http://127.0.0.1:3000 |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Bootnode   │────▶│   Sealer    │────▶│  Explorer   │
│  UDP 30301  │     │  RPC 8545   │     │  Port 3000  │
│             │     │  WS  8546   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  Contracts  │
                    │ VerseToken  │
                    │ StakingVault│
                    │ Rewards     │
                    │ Treasury    │
                    │ Strategy    │
                    │ Oracle      │
                    │ Emergency   │
                    │ Withdrawal  │
                    └─────────────┘
```

## Ports

| Service | Port |
|---------|------|
| JSON-RPC | 8545 |
| WebSocket | 8546 |
| Bootnode | 30301/UDP |
| P2P | 30303/UDP |
| Block Explorer | 3000 |