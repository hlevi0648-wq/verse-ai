require('@nomicfoundation/hardhat-toolbox');

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '0xb55b9c54f0897e377b6ab885be56fce37d08546b64227abf829437fa7ee7cf86';

module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      evmVersion: 'cancun',
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    verse: {
      url: 'http://127.0.0.1:8545',
      chainId: 7707,
      accounts: [PRIVATE_KEY],
      gas: 30000000,
      gasPrice: 1000000000,
    },
    verse_remote: {
      url: process.env.VERSE_RPC_URL || 'http://127.0.0.1:8545',
      chainId: 7707,
      accounts: [PRIVATE_KEY],
    },
  },
};