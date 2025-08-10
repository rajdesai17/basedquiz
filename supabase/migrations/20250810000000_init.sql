-- Minimal schema for Base Trivia Mini App (MVP)

create table if not exists public.daily_rounds (
  id serial primary key,
  date date unique not null,
  status text not null default 'active',
  created_at timestamptz default now()
);

create table if not exists public.questions (
  id serial primary key,
  round_id integer not null references public.daily_rounds(id) on delete cascade,
  category text not null,
  question_text text not null,
  options jsonb not null,
  correct_index integer not null check (correct_index between 0 and 3),
  explanation text,
  source text default 'gemini',
  generated_at timestamptz default now()
);

create table if not exists public.scores (
  id serial primary key,
  round_id integer not null references public.daily_rounds(id) on delete cascade,
  wallet_address text not null,
  correct_count integer not null,
  total integer not null default 5,
  time_ms integer not null,
  submitted_at timestamptz default now(),
  unique (round_id, wallet_address)
);

-- Indexes
create index if not exists scores_round_rank_idx on public.scores (round_id, correct_count desc, time_ms asc);
create index if not exists questions_round_idx on public.questions (round_id);

