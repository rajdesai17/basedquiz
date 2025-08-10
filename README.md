# Base Trivia Mini App (MVP)

See `overview.md` for the product plan. This README is a quick run guide.

## Prereqs
- Node 18+
- Supabase project (URL + anon key + service role key)
- Gemini API key

## Setup (Windows PowerShell)
```powershell
npm install
# set env vars locally (e.g., .env.local)
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE=...
# GEMINI_API_KEY=...
# NEXT_PUBLIC_URL=http://localhost:3000
npm run dev
```

## Supabase CLI (recommended)
```powershell
# 1) Login and link your project
supabase login
supabase link --project-ref <your_project_ref>

# 2) Push the initial schema
supabase db push

# 3) Start local dev (optional)
supabase start
```

## Daily question generation
- Deploy to Vercel and add a Cron job to POST `/api/admin/generate` daily (UTC)
- Alternatively hit it manually in dev

## Pages
- `/` quick links
- `/play` gameplay (5 questions)
- `/leaderboard` today’s top scores

## API
- `GET /api/daily`
- `POST /api/score`
- `GET /api/leaderboard`
- `POST /api/admin/generate` (cron)

## Notes
- For MVP, wallet address is a placeholder in `/play`. Wire to Base MiniKit provider when integrating inside Base App.
