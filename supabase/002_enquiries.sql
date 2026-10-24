-- 0800 Cleaning & Restoration: quote and booking enquiries from the website.
-- Run once in Supabase → SQL Editor → New query → Run.

create table if not exists public.enquiries (
  id         uuid primary key default gen_random_uuid(),
  reference  text unique not null,
  created_at timestamptz not null default now(),
  status     text not null default 'new' check (status in ('new', 'contacted', 'booked', 'closed')),
  type       text not null,
  name       text not null,
  email      text not null,
  phone      text,
  region     text,
  suburb     text,
  data       jsonb not null default '{}'::jsonb
);

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);

-- Row Level Security on, with NO public policies: customer details can only be
-- read or written by the website's server (secret key), never with the public key.
alter table public.enquiries enable row level security;
