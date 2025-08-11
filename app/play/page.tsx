'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'
import { useAccount } from 'wagmi'

type Question = {
  id: number
  question_text: string
  options: string[]
  correct_index: number
}

export default function PlayPage() {
  // Use wagmi for wallet connection status per OnchainKit docs
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roundId, setRoundId] = useState<number | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<number[]>([])
  const [startMs, setStartMs] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [claimInfo, setClaimInfo] = useState<{ token?: any; eth?: any } | null>(null)
  const totalSeconds = 60

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/daily', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load daily questions')
        const data = await res.json()
        if (!mounted) return
        setRoundId(data.round.id)
        setQuestions(
          (data.questions as any[]).map((q) => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options,
            correct_index: q.correct_index,
          }))
        )
        setAnswers(new Array(data.questions.length).fill(-1))
        setStartMs(performance.now())
      } catch (e: any) {
        setError(e.message || 'Error loading')
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [address])

  const answeredAll = useMemo(
    () => answers.length > 0 && answers.every((a) => a >= 0),
    [answers]
  )

  const [countdown, setCountdown] = useState(totalSeconds)
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (countdown === 0 && !submitted) {
      void onSubmit()
    }
  }, [countdown, submitted])

  async function onSubmit() {
    if (submitted) return
    setSubmitted(true)
    try {
      const endMs = performance.now()
      const elapsedMs = Math.max(0, Math.round((endMs - (startMs ?? endMs))))
      const wallet = address || 'demo-wallet'
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId,
          wallet,
          answers,
          elapsedMs,
        }),
      })
      if (!res.ok) throw new Error('Failed to submit score')
      // Fetch claim availability (token and/or eth)
      const [tokenClaim, ethClaim] = await Promise.all([
        fetch(`/api/claim/token?roundId=${roundId}&wallet=${address}`).then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch(`/api/claim?roundId=${roundId}&wallet=${address}`).then((r) => r.ok ? r.json() : null).catch(() => null),
      ])
      setClaimInfo({ token: tokenClaim, eth: ethClaim })
    } catch (e) {
      // ignore for MVP UI
    }
  }

  if (!isConnected)
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="card">
          <h2 className="text-xl font-semibold">Sign in required</h2>
          <p className="mt-2 text-neutral-300">Open this Mini App inside Base App and connect your wallet to play.</p>
        </div>
      </main>
    )
  if (loading) return <main className="p-6">Loading…</main>
  if (error) return <main className="p-6 text-red-400">{error}</main>

  return (
    <main className="container-page py-6">
      <div className="mb-4 flex items-center justify-between text-xs sm:text-sm text-neutral-400">
        <div>Time left: {countdown}s</div>
        <div>{questions.length} questions</div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void onSubmit()
        }}
        className="space-y-4 sm:space-y-6"
      >
        {questions.map((q, idx) => (
          <div key={q.id} className="card">
            <div className="font-medium text-base sm:text-lg">Q{idx + 1}. {q.question_text}</div>
            <div className="mt-3 grid gap-2">
              {q.options.map((opt, oi) => (
                <label key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`q-${idx}`}
                    className="accent-sky-500"
                    checked={answers[idx] === oi}
                    onChange={() =>
                      setAnswers((prev) => {
                        const next = [...prev]
                        next[idx] = oi
                        return next
                      })
                    }
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <button
          type="submit"
          className="btn btn-primary w-full sm:w-auto"
          disabled={!answeredAll || submitted}
        >
          {submitted ? 'Submitted' : 'Submit'}
        </button>
      </form>

      {submitted && (
        <div className="mt-6 card">
          <h3 className="text-lg font-semibold">Come back tomorrow</h3>
          <p className="text-neutral-300 mt-2">You can play once per day. Your submission is recorded.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="btn btn-ghost"
              disabled={!claimInfo?.token}
              onClick={() => alert('Claim BQ: open Claim modal in production')}
            >
              Claim BQ
            </button>
            <button
              className="btn btn-ghost"
              disabled={!claimInfo?.eth}
              onClick={() => alert('Claim ETH: open Claim modal in production')}
            >
              Claim ETH
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

