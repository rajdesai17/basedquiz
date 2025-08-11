const hre = require('hardhat')

async function main() {
  const tokenAddr = process.env.BQ_TOKEN_ADDRESS
  const who = process.env.WHO_ADDR
  if (!tokenAddr) throw new Error('BQ_TOKEN_ADDRESS missing')
  if (!who) throw new Error('WHO_ADDR missing')

  const abi = [
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address) view returns (uint256)'
  ]

  const token = new hre.ethers.Contract(tokenAddr, abi, hre.ethers.provider)
  const [symbol, decimals, bal] = await Promise.all([
    token.symbol(),
    token.decimals(),
    token.balanceOf(who),
  ])

  console.log('Token:', symbol)
  console.log('Address:', tokenAddr)
  console.log('Holder:', who)
  console.log('BalanceRaw:', bal.toString())
  console.log('Balance:', hre.ethers.formatUnits(bal, decimals))
}

main().catch((e) => { console.error(e); process.exit(1) })


