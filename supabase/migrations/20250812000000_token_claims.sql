-- Token claims generated for free days so users claim and pay gas
create table if not exists public.token_claims (
  id serial primary key,
  round_id integer not null references public.daily_rounds(id) on delete cascade,
  wallet_address text not null,
  amount_tokens numeric not null,
  nonce text not null,
  signature text not null,
  created_at timestamptz default now(),
  unique (round_id, wallet_address)
);

create index if not exists token_claims_round_idx on public.token_claims (round_id);
create index if not exists token_claims_wallet_idx on public.token_claims (wallet_address);


