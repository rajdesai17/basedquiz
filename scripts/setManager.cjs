const hre = require('hardhat')

async function main() {
  const vaultAddr = process.env.VAULT_ADDRESS
  const managerAddr = process.env.PAYOUT_MANAGER
  if (!vaultAddr) throw new Error('VAULT_ADDRESS missing')
  if (!managerAddr) throw new Error('PAYOUT_MANAGER missing')

  const vaultAbi = [
    'function setPayoutManager(address) external',
    'function owner() view returns (address)'
  ]

  const [signer] = await hre.ethers.getSigners()
  console.log('Using signer:', await signer.getAddress())
  console.log('Vault:', vaultAddr)
  console.log('New manager:', managerAddr)

  const vault = new hre.ethers.Contract(vaultAddr, vaultAbi, signer)
  const tx = await vault.setPayoutManager(managerAddr)
  console.log('setPayoutManager tx:', tx.hash)
  await tx.wait()
  console.log('Manager updated')
}

main().catch((e) => { console.error(e); process.exit(1) })


