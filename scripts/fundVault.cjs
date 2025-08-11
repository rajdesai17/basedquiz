const hre = require('hardhat')

async function main() {
  const tokenAddr = process.env.BQ_TOKEN_ADDRESS
  const vaultAddr = process.env.VAULT_ADDRESS
  const humanAmount = process.env.FUND_AMOUNT || '10000' // default 10k BQ

  if (!tokenAddr) throw new Error('BQ_TOKEN_ADDRESS missing in .env')
  if (!vaultAddr) throw new Error('VAULT_ADDRESS missing in .env')

  const erc20Abi = [
    'function transfer(address to, uint256 amount) public returns (bool)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address) view returns (uint256)'
  ]

  const [deployer] = await hre.ethers.getSigners()
  console.log('Funding from:', await deployer.getAddress())
  console.log('Token:', tokenAddr)
  console.log('Vault:', vaultAddr)

  const token = new hre.ethers.Contract(tokenAddr, erc20Abi, deployer)
  const decimals = await token.decimals()
  const amount = hre.ethers.parseUnits(humanAmount.toString(), decimals)

  const bal = await token.balanceOf(await deployer.getAddress())
  if (bal < amount) {
    throw new Error(`Insufficient token balance. Have ${bal.toString()}, need ${amount.toString()}`)
  }

  const tx = await token.transfer(vaultAddr, amount)
  console.log('Transfer sent:', tx.hash)
  await tx.wait()
  console.log('Vault funded with', humanAmount, 'tokens')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


