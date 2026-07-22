-- Multi-Tenant SaaS Schema

-- 1. Create Societies Table
create table if not exists public.societies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Profiles Table in Supabase
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  society_id uuid references public.societies(id) on delete set null,
  email text not null,
  full_name text,
  phone text,
  role text check (role in ('admin', 'committee', 'resident')) default 'resident',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.societies enable row level security;
alter table public.profiles enable row level security;

-- Societies policies (Only members of the society can view it)
create policy "Users can view their own society"
  on public.societies for select
  to authenticated
  using (id = (select society_id from public.profiles where id = auth.uid()));

create policy "Admins can insert society"
  on public.societies for insert
  to authenticated
  with check (true);

-- Profiles policies
create policy "Authenticated users can view profiles in their society"
  on public.profiles for select
  to authenticated
  using (society_id = (select society_id from public.profiles where id = auth.uid()) OR id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated, anon
  with check (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Admins can update profiles in their society"
  on public.profiles for update
  to authenticated
  using (
    (select role from public.profiles where id = auth.uid()) in ('admin', 'committee')
    AND society_id = (select society_id from public.profiles where id = auth.uid())
  );

-- Automatic handle_new_user trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone, role, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'admin'), -- First user without invite defaults to admin for onboarding
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create Helper Function for checking role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Towers Table
create table if not exists public.towers (
  id uuid primary key default gen_random_uuid(),
  society_id uuid references public.societies(id) on delete cascade not null,
  name text not null,
  structure_type text default 'tower',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Flats Table
create table if not exists public.flats (
  id uuid primary key default gen_random_uuid(),
  society_id uuid references public.societies(id) on delete cascade not null,
  tower_id uuid references public.towers(id) on delete cascade not null,
  number text not null,
  floor integer,
  property_type text default 'flat',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(society_id, tower_id, number)
);

-- 5. Create Flat Residents mapping table
create table if not exists public.flat_residents (
  id uuid primary key default gen_random_uuid(),
  society_id uuid references public.societies(id) on delete cascade not null,
  flat_id uuid references public.flats(id) on delete cascade not null,
  resident_id uuid references public.profiles(id) on delete cascade not null,
  is_owner boolean default false,
  move_in_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(flat_id, resident_id)
);

-- 6. Create Notices Table
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  society_id uuid references public.societies(id) on delete cascade not null,
  title text not null,
  body text not null,
  is_emergency boolean default false,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Database Triggers for Multi-Tenancy (Auto-inject society_id)
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.society_id IS NULL THEN
    NEW.society_id := (SELECT society_id FROM public.profiles WHERE id = auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_tenant_towers BEFORE INSERT ON public.towers FOR EACH ROW EXECUTE PROCEDURE public.set_tenant_id();
CREATE TRIGGER set_tenant_flats BEFORE INSERT ON public.flats FOR EACH ROW EXECUTE PROCEDURE public.set_tenant_id();
CREATE TRIGGER set_tenant_flat_residents BEFORE INSERT ON public.flat_residents FOR EACH ROW EXECUTE PROCEDURE public.set_tenant_id();
CREATE TRIGGER set_tenant_notices BEFORE INSERT ON public.notices FOR EACH ROW EXECUTE PROCEDURE public.set_tenant_id();

-- Enable RLS
alter table public.towers enable row level security;
alter table public.flats enable row level security;
alter table public.flat_residents enable row level security;
alter table public.notices enable row level security;

-- Tenant Isolation Policies
create policy "Tenant isolation for towers" on public.towers for all to authenticated 
using (society_id = (select society_id from public.profiles where id = auth.uid()));

create policy "Tenant isolation for flats" on public.flats for all to authenticated 
using (society_id = (select society_id from public.profiles where id = auth.uid()));

create policy "Tenant isolation for flat_residents" on public.flat_residents for all to authenticated 
using (society_id = (select society_id from public.profiles where id = auth.uid()));

create policy "Tenant isolation for notices" on public.notices for all to authenticated 
using (society_id = (select society_id from public.profiles where id = auth.uid()));
