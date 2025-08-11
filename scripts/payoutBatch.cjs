const hre = require('hardhat')

async function main() {
  const vaultAddr = process.env.VAULT_ADDRESS
  const tokenAddr = process.env.BQ_TOKEN_ADDRESS
  const recipients = (process.env.RECIPIENTS || '').split(',').map((s) => s.trim()).filter(Boolean)
  const amountsHuman = (process.env.AMOUNTS || '').split(',').map((s) => s.trim()).filter(Boolean)

  if (!vaultAddr) throw new Error('VAULT_ADDRESS missing')
  if (!tokenAddr) throw new Error('BQ_TOKEN_ADDRESS missing')
  if (recipients.length === 0 || recipients.length !== amountsHuman.length) {
    throw new Error('Provide RECIPIENTS and AMOUNTS as equal-length comma-separated lists')
  }

  const tokenAbi = [ 'function decimals() view returns (uint8)' ]
  const vaultAbi = [ 'function payoutBatch(address[] to, uint256[] amounts) external' ]

  const [signer] = await hre.ethers.getSigners()
  console.log('Using signer:', await signer.getAddress())
  console.log('Vault:', vaultAddr)
  console.log('Token:', tokenAddr)
  console.log('Recipients:', recipients)
  console.log('Amounts (human):', amountsHuman)

  const token = new hre.ethers.Contract(tokenAddr, tokenAbi, signer)
  const decimals = await token.decimals()
  const amounts = amountsHuman.map((h) => hre.ethers.parseUnits(h, decimals))

  const vault = new hre.ethers.Contract(vaultAddr, vaultAbi, signer)
  const tx = await vault.payoutBatch(recipients, amounts)
  console.log('Batch payout sent:', tx.hash)
  await tx.wait()
  console.log('Batch payout confirmed')
}

main().catch((e) => { console.error(e); process.exit(1) })


