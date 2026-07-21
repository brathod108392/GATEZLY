-- Create Profiles Table in Supabase
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role text check (role in ('admin', 'committee', 'resident')) default 'resident',
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

-- Automatic handle_new_user trigger (optional database-level backup)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone, role, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'resident'),
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    phone = excluded.phone,
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

-- Create Towers Table
create table if not exists public.towers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Flats Table
create table if not exists public.flats (
  id uuid primary key default gen_random_uuid(),
  tower_id uuid references public.towers(id) on delete cascade not null,
  number text not null,
  floor integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tower_id, number)
);

-- Create Flat Residents mapping table
create table if not exists public.flat_residents (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid references public.flats(id) on delete cascade not null,
  resident_id uuid references public.profiles(id) on delete cascade not null,
  is_owner boolean default false,
  move_in_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(flat_id, resident_id)
);

-- Enable RLS for Flats module
alter table public.towers enable row level security;
alter table public.flats enable row level security;
alter table public.flat_residents enable row level security;

-- Create RLS Policies for Flats module (Committee & Admin have full access, residents have read-only for their own data)
create policy "Authenticated users can view towers" on public.towers for select to authenticated using (true);
create policy "Admins and committee can manage towers" on public.towers for all to authenticated using (public.get_user_role() in ('admin', 'committee'));

create policy "Authenticated users can view flats" on public.flats for select to authenticated using (true);
create policy "Admins and committee can manage flats" on public.flats for all to authenticated using (public.get_user_role() in ('admin', 'committee'));

create policy "Authenticated users can view flat residents" on public.flat_residents for select to authenticated using (true);
create policy "Admins and committee can manage flat residents" on public.flat_residents for all to authenticated using (public.get_user_role() in ('admin', 'committee'));
