-- Add paid/free day fields to daily_rounds
alter table if exists public.daily_rounds
  add column if not exists paid_day boolean default false,
  add column if not exists entry_fee_wei numeric;

-- Claims for paid days (ETH payouts via BaseRallyPool claim)
create table if not exists public.claims (
  id serial primary key,
  round_id integer not null references public.daily_rounds(id) on delete cascade,
  wallet_address text not null,
  amount_wei numeric not null,
  nonce text not null,
  signature text not null,
  created_at timestamptz default now(),
  unique (round_id, wallet_address)
);

create index if not exists claims_round_idx on public.claims (round_id);
create index if not exists claims_wallet_idx on public.claims (wallet_address);

-- Token payouts (free days via BQ vault)
create table if not exists public.payouts (
  id serial primary key,
  round_id integer not null references public.daily_rounds(id) on delete cascade,
  wallet_address text not null,
  amount_tokens numeric not null,
  tx_hash text,
  created_at timestamptz default now()
);

create index if not exists payouts_round_idx on public.payouts (round_id);
create index if not exists payouts_wallet_idx on public.payouts (wallet_address);


