-- ChainGuard AI — Initial Database Schema
-- Run this in your Supabase SQL editor or via `supabase db push`

-- ─── Enable UUID extension ────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Audits Table ─────────────────────────────────────────────────────────────
create table if not exists public.audits (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete set null,
  contract_name   text,
  contract_code   text not null,
  report_json     jsonb not null,
  trust_score     integer not null check (trust_score >= 0 and trust_score <= 100),
  created_at      timestamptz not null default now()
);

-- Index for fetching a user's audit history
create index if not exists audits_user_id_idx on public.audits(user_id, created_at desc);

-- ─── Subscriptions Table ──────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                        uuid primary key default uuid_generate_v4(),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id        text unique,
  stripe_subscription_id    text unique,
  plan                      text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  status                    text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  audits_used_this_month    integer not null default 0,
  current_period_end        timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (user_id)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.audits enable row level security;
alter table public.subscriptions enable row level security;

-- Users can read their own audits
create policy "Users can view own audits"
  on public.audits for select
  using (auth.uid() = user_id);

-- Users can insert audits (authenticated or anonymous)
create policy "Users can create audits"
  on public.audits for insert
  with check (auth.uid() = user_id or user_id is null);

-- Badge page: public audits with score >= 80 are readable by anyone
create policy "Public trust badges are viewable"
  on public.audits for select
  using (trust_score >= 80);

-- Users can only view/update their own subscription
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can update own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id);

-- ─── Function: increment_audit_count ─────────────────────────────────────────
create or replace function public.increment_audit_count(p_user_id uuid)
returns void as $$
begin
  insert into public.subscriptions (user_id, audits_used_this_month)
  values (p_user_id, 1)
  on conflict (user_id)
  do update set
    audits_used_this_month = subscriptions.audits_used_this_month + 1,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- ─── Function: reset monthly audit count (call via cron or Stripe webhook) ────
create or replace function public.reset_monthly_audit_count(p_user_id uuid)
returns void as $$
begin
  update public.subscriptions
  set audits_used_this_month = 0,
      updated_at = now()
  where user_id = p_user_id;
end;
$$ language plpgsql security definer;
