require('dotenv').config({ path: '.env' })

require('@nomicfoundation/hardhat-toolbox')

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    base_mainnet: {
      url: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
      accounts: process.env.OWNER_PK ? [process.env.OWNER_PK] : [],
      chainId: 8453,
    },
  },
}

module.exports = config


