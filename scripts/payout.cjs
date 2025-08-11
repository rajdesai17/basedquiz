const hre = require('hardhat')

async function main() {
  const vaultAddr = process.env.VAULT_ADDRESS
  const tokenAddr = process.env.BQ_TOKEN_ADDRESS
  const winner = process.env.WINNER_ADDR
  const amountHuman = process.env.AMOUNT_HUMAN || '1'

  if (!vaultAddr) throw new Error('VAULT_ADDRESS missing')
  if (!tokenAddr) throw new Error('BQ_TOKEN_ADDRESS missing')
  if (!winner) throw new Error('WINNER_ADDR missing')

  const tokenAbi = [
    'function decimals() view returns (uint8)'
  ]
  const vaultAbi = [
    'function payout(address to, uint256 amount) external',
    'function owner() view returns (address)',
    'function payoutManager() view returns (address)'
  ]

  const [signer] = await hre.ethers.getSigners()
  console.log('Using signer:', await signer.getAddress())
  console.log('Vault:', vaultAddr)
  console.log('Token:', tokenAddr)
  console.log('Winner:', winner)
  console.log('Amount (human):', amountHuman)

  const token = new hre.ethers.Contract(tokenAddr, tokenAbi, signer)
  const decimals = await token.decimals()
  const amount = hre.ethers.parseUnits(amountHuman.toString(), decimals)

  const vault = new hre.ethers.Contract(vaultAddr, vaultAbi, signer)

  const tx = await vault.payout(winner, amount)
  console.log('Payout sent:', tx.hash)
  await tx.wait()
  console.log('Payout confirmed')
}

main().catch((e) => { console.error(e); process.exit(1) })


