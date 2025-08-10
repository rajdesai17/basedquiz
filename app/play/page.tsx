'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMiniKit } from '@coinbase/onchainkit/minikit'

type Question = {
  id: number
  question_text: string
  options: string[]
  correct_index: number
}

export default function PlayPage() {
  const { address } = useMiniKit() as any
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roundId, setRoundId] = useState<number | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<number[]>([])
  const [startMs, setStartMs] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
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
      // noop
    } catch (e) {
      // ignore for MVP UI
    }
  }

  if (!address)
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
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between text-sm text-neutral-400">
        <div>Time left: {countdown}s</div>
        <div>{questions.length} questions</div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void onSubmit()
        }}
        className="space-y-6"
      >
        {questions.map((q, idx) => (
          <div key={q.id} className="card">
            <div className="font-medium">Q{idx + 1}. {q.question_text}</div>
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
          className="btn btn-primary"
          disabled={!answeredAll || submitted}
        >
          {submitted ? 'Submitted' : 'Submit'}
        </button>
      </form>
    </main>
  )
}

