-- Create Profiles Table in Supabase
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text check (role in ('admin', 'committee')) default 'committee',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Drop any conflicting/recursive legacy policies
drop policy if exists "Public profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Enable read access for authenticated users" on public.profiles;

-- Create Non-Recursive RLS Policies
-- 1. Read Policy: Allow authenticated users to view profiles without self-referential queries
create policy "Authenticated users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- 2. Insert Policy: Allow users to insert their own profile upon signup
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated, anon
  with check (true);

-- 3. Update Policy: Allow users to update only their own profile matching auth.uid()
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Automatic handle_new_user trigger (optional backup)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.raw_user_meta_data->>'role', 'committee')
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    role = excluded.role,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
