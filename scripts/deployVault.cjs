const hre = require('hardhat')

async function main() {
  const BQ_TOKEN_ADDRESS = process.env.BQ_TOKEN_ADDRESS
  const PAYOUT_MANAGER = process.env.PAYOUT_MANAGER || hre.ethers.ZeroAddress

  if (!BQ_TOKEN_ADDRESS || BQ_TOKEN_ADDRESS === hre.ethers.ZeroAddress) {
    throw new Error('Set BQ_TOKEN_ADDRESS in your .env (BQ ERC-20 address)')
  }

  const Factory = await hre.ethers.getContractFactory('TokenPayoutVault')
  const vault = await Factory.deploy(BQ_TOKEN_ADDRESS, PAYOUT_MANAGER)
  await vault.waitForDeployment()
  console.log('TokenPayoutVault deployed:', await vault.getAddress())
  console.log('Token:', BQ_TOKEN_ADDRESS)
  console.log('Manager:', PAYOUT_MANAGER === hre.ethers.ZeroAddress ? 'owner (deployer)' : PAYOUT_MANAGER)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


