const hre = require('hardhat')

async function main() {
  const ENTRY_FEE_WEI = process.env.ENTRY_FEE_WEI || '0'
  const SIGNER = process.env.PAYOUT_SIGNER || hre.ethers.ZeroAddress

  const Factory = await hre.ethers.getContractFactory('BaseRallyPool')
  const pool = await Factory.deploy(ENTRY_FEE_WEI, SIGNER)
  await pool.waitForDeployment()
  console.log('BaseRallyPool deployed:', await pool.getAddress())
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


