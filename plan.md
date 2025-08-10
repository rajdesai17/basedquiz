# Paid-Day-Trivia-Passport — Farcaster Mini App Plan

This file tracks the step-by-step implementation from MVP to paid day and onchain prizes.

---

## Phase 0 – Production Baseline (no mocks, Base mainnet)
- [x] Next.js + Tailwind v4
- [x] Supabase schema + APIs: `/api/daily`, `/api/score`, `/api/leaderboard`, `/api/admin/generate`
- [x] Farcaster Mini App: hosted manifest + `sdk.actions.ready()`
- [x] Wallet UI (OnchainKit) in header
- [x] Pages: `/`, `/play`, `/leaderboard`, `/enter` (placeholder)
- [x] Vercel Cron (daily) pointing to `/api/admin/generate`

Hard requirements to set now (production env):
- [ ] Set `NEXT_PUBLIC_URL` on Vercel to `https://basedquiz.vercel.app`
- [ ] Add brand images in `public/`: `favicon.ico`, `icon.png`, `image.png`, `splash.png`
- [ ] Configure logging/monitoring (Vercel, Supabase logs)

---

## Phase 1 – Daily Questions & Wallet Gating (prod)
- [x] Gate `/play` by wallet (MiniKit `address` check)
- [x] Persist one score per wallet per day (DB unique)
- [x] Cron daily generation (UTC)
- [ ] Content QA: Adjust Gemini prompt/temperature; add category rotation
- [ ] Add basic rate limiting for APIs (middleware/ip-based)

Verification:
- [ ] `/api/daily` returns 5 questions daily
- [ ] `/play` requires wallet and submits score once/day
- [ ] `/leaderboard` shows ordered scores

---

## Phase 2 – Paid Day Entry (Day 4) on Base mainnet
DB / API:
- [ ] Add to `daily_rounds`: `paid_day boolean`, `entry_fee_wei bigint`
- [ ] `GET /api/round/:id` → `{ paidDay, entryFeeWei }`
- [ ] `/enter` page: show fee; call contract `enter(roundId)`; persist tx hash to `entries`

Contract (Hardhat → Base mainnet 8453):
- [x] Add Hardhat toolchain
- [x] Implement `BaseRallyPool.sol`:
  - `constructor(uint256 _entryFee, address _signer)`
  - `enter(uint256 roundId)` payable
  - owner funcs: `setEntryFee`, `setSigner`, `withdraw`
- [ ] Security review (reentrancy, access control)
- [ ] Deploy to Base mainnet; set envs:
  - `NEXT_PUBLIC_POOL_ADDRESS`
  - `BASE_RPC_URL` (server only)
  - `OWNER_PK` (server only)
- [ ] Wire `enter` via `viem/wagmi` from `/enter`

---

## Phase 3 – Prize Distribution (Offchain sign, onchain claim)
Backend:
- [ ] Compute winners after round close; generate random nonce per winner
- [ ] Hash: `keccak256(abi.encodePacked(roundId, winner, amount, nonce))`
- [ ] Sign with server key; store `{wallet, amount, nonce, sig}` in `claims`
- [ ] API: `GET /api/claim?roundId` returns claim payload for wallet

Contract:
- [ ] `claim(uint256 roundId, uint256 amount, bytes32 nonce, bytes signature)`
- [ ] Verify signer, transfer amount, mark nonce used

UI:
- [ ] `/claim` page to fetch and call claim

---

## Phase 4 – Security & QA
- [ ] Rate limiting on APIs
- [ ] Basic anti-abuse heuristics (time bound checks present)
- [ ] E2E flow tests (free days, paid enter, claim)
- [ ] Supabase RLS policies for tables (read leaderboards safely)
- [ ] Secrets segregation (no client exposure)

---

## Phase 5 – Launch
- [ ] Vercel production with Cron configured
- [ ] Farcaster Mini App listing details (splash, screenshots, categories)
- [ ] Docs updates
- [ ] Incident runbook + monitoring alerts

---

## Notes
- Keep paid/onchain isolated so MVP continues working if contract down
- All secrets only in Vercel env
- Chain config for prod:
  - `NEXT_PUBLIC_CHAIN_ID=8453` (Base mainnet)
  - `NEXT_PUBLIC_URL=https://basedquiz.vercel.app`
  - `NEXT_PUBLIC_CDP_CLIENT_API_KEY=<cdp_client_key>`
  - `FARCASTER_HEADER/PAYLOAD/SIGNATURE` (if self-hosting manifest)


