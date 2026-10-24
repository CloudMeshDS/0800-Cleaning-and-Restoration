-- 0800 Cleaning & Restoration: storage for admin-edited settings (prices).
-- Run once in Supabase → SQL Editor → New query → Run.

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: anyone may READ the price overrides (they are shown on
-- the public website anyway). Nobody can write with the public key; the
-- website's server writes with the secret key, which bypasses RLS.
alter table public.site_settings enable row level security;

drop policy if exists "Public can read pricing" on public.site_settings;
create policy "Public can read pricing"
  on public.site_settings
  for select
  to anon, authenticated
  using (key = 'pricing_overrides');

insert into public.site_settings (key, value)
values ('pricing_overrides', '{}'::jsonb)
on conflict (key) do nothing;
