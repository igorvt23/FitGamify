-- Execute este script no SQL Editor do Supabase
create table if not exists public.user_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_backups enable row level security;

create policy if not exists "Users can read own backup"
on public.user_backups for select
using (auth.uid() = user_id);

create policy if not exists "Users can write own backup"
on public.user_backups for insert
with check (auth.uid() = user_id);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  age integer not null,
  height_cm numeric not null,
  weight_kg numeric not null,
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy if not exists "Users can read own profile"
on public.user_profiles for select
using (auth.uid() = id);

create policy if not exists "Users can insert own profile"
on public.user_profiles for insert
with check (auth.uid() = id);

create policy if not exists "Users can update own profile"
on public.user_profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy if not exists "Users can update own backup"
on public.user_backups for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
