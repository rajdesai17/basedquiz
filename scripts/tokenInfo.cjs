const hre = require('hardhat')

async function main() {
  const tokenAddr = process.env.BQ_TOKEN_ADDRESS || '0xa881C0406ECbEef8c15E4129ab63cdF15Fde8B07'

  if (!tokenAddr) throw new Error('BQ_TOKEN_ADDRESS missing in env')

  const abi = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)'
  ]

  const token = new hre.ethers.Contract(tokenAddr, abi, hre.ethers.provider)
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    token.totalSupply(),
  ])

  const totalHuman = hre.ethers.formatUnits(totalSupply, decimals)

  // Approximate unlocked supply based on Clanker reply (25% vaulted)
  const unlocked = (totalSupply * 75n) / 100n
  const unlockedHuman = hre.ethers.formatUnits(unlocked, decimals)

  console.log('Token:', name, `(${symbol})`)
  console.log('Address:', tokenAddr)
  console.log('Decimals:', decimals)
  console.log('Total Supply:', totalHuman)
  console.log('Approx. Unlocked (75%):', unlockedHuman)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


