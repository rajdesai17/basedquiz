require('dotenv').config({ path: '.env' })
const { ethers } = require('ethers')

async function main() {
  const roundId = Number(process.env.ROUND_ID)
  const topN = Number(process.env.TOP_N || '10')
  const tokensPerWinner = process.env.TOKENS_PER_WINNER || process.env.FREE_DAY_TOKENS_PER_WINNER || '10'
  const leaderboardUrl = process.env.LEADERBOARD_URL || `http://localhost:3000/api/leaderboard?roundId=${roundId}`

  if (!roundId) throw new Error('ROUND_ID missing')
  const rpc = process.env.BASE_RPC_URL
  const pk = process.env.OWNER_PK
  const tokenAddr = process.env.BQ_TOKEN_ADDRESS
  const vaultAddr = process.env.VAULT_ADDRESS
  if (!rpc || !pk || !tokenAddr || !vaultAddr) throw new Error('Missing env: BASE_RPC_URL / OWNER_PK / BQ_TOKEN_ADDRESS / VAULT_ADDRESS')

  const res = await fetch(leaderboardUrl)
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`)
  const ranked = await res.json()

  const winners = ranked.slice(0, topN).map((r) => r.wallet_address)
  if (winners.length === 0) {
    console.log('No winners to payout')
    return
  }

  const provider = new ethers.JsonRpcProvider(rpc)
  const signer = new ethers.Wallet(pk, provider)

  const tokenAbi = [ 'function decimals() view returns (uint8)' ]
  const vaultAbi = [ 'function payout(address to, uint256 amount) external' ]
  const token = new ethers.Contract(tokenAddr, tokenAbi, signer)
  const decimals = await token.decimals()
  const vault = new ethers.Contract(vaultAddr, vaultAbi, signer)

  const amount = ethers.parseUnits(tokensPerWinner.toString(), decimals)
  console.log('Round:', roundId)
  console.log('Winners:', winners)
  console.log('Per-winner:', tokensPerWinner)

  let success = 0
  for (const w of winners) {
    try {
      const tx = await vault.payout(w, amount)
      console.log('Payout sent:', w, tx.hash)
      await tx.wait()
      success++
    } catch (e) {
      console.error('Payout failed for', w, e.message)
    }
  }
  console.log('Payouts complete. Success:', success, '/', winners.length)
}

main().catch((e) => { console.error(e); process.exit(1) })


