const hre = require('hardhat')

async function main() {
  const token = process.env.BQ_TOKEN_ADDRESS
  const signer = process.env.PAYOUT_SIGNER || hre.ethers.ZeroAddress
  if (!token || signer === hre.ethers.ZeroAddress) throw new Error('Set BQ_TOKEN_ADDRESS and PAYOUT_SIGNER')

  const Factory = await hre.ethers.getContractFactory('TokenAirdrop')
  const drop = await Factory.deploy(token, signer)
  await drop.waitForDeployment()
  console.log('TokenAirdrop deployed:', await drop.getAddress())
}

main().catch((e) => { console.error(e); process.exit(1) })


