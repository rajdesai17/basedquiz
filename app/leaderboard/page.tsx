type Leader = {
  wallet_address: string
  correct_count: number
  time_ms: number
}

async function getLeaders(): Promise<Leader[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL ?? ''}/api/leaderboard`, {
    cache: 'no-store',
    next: { revalidate: 0 },
  })
  if (!res.ok) return []
  return res.json()
}

export default async function LeaderboardPage() {
  const leaders = await getLeaders()
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Leaderboard (Today)</h1>
      <p className="mt-2 text-neutral-400 text-sm">Ranking uses wallet address only. You must be signed in with your wallet to play.</p>
      <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900/60 text-neutral-300">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Wallet</th>
              <th className="px-4 py-2">Correct</th>
              <th className="px-4 py-2">Time (ms)</th>
            </tr>
          </thead>
          <tbody>
            {leaders.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-neutral-400" colSpan={4}>No scores yet.</td>
              </tr>
            )}
            {leaders.map((l, i) => (
              <tr key={`${l.wallet_address}-${i}`} className="odd:bg-neutral-950 even:bg-neutral-900/40">
                <td className="px-4 py-2">{i + 1}</td>
                <td className="px-4 py-2 font-mono text-xs">{l.wallet_address.slice(0,6)}…{l.wallet_address.slice(-4)}</td>
                <td className="px-4 py-2">{l.correct_count}/5</td>
                <td className="px-4 py-2">{l.time_ms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

