-- ==========================================
-- Gatezly Multi-Tenant SaaS Schema
-- ==========================================

-- 1. Create Societies Table (with scalability features)
create table if not exists public.societies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  address text,
  logo_url text,
  subscription_plan text default 'basic',
  custom_domain text unique,
  modules jsonb default '{"visitors": true, "complaints": true, "notices": true, "maintenance": true}',
  settings jsonb default '{}',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Profiles Table in Supabase
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  society_id uuid references public.societies(id) on delete set null,
  email text not null,
  full_name text,
  phone text,
  role text check (role in ('superadmin', 'admin', 'committee', 'resident', 'guard')) default 'resident',
  is_active boolean default true,
  expo_push_token text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Constraint: If role is not superadmin, they MUST belong to a society. 
  -- Superadmin MUST NOT belong to a society.
  CONSTRAINT check_society_assignment CHECK (
    (role = 'superadmin' AND society_id IS NULL) OR 
    (role != 'superadmin' AND society_id IS NOT NULL)
  )
);

-- 3. Enable Row Level Security (RLS)
alter table public.societies enable row level security;
alter table public.profiles enable row level security;

-- Security Definer Functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auth_user_society_id()
RETURNS uuid AS $$
  SELECT society_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Societies policies
create policy "Super Admins have full access to societies"
  on public.societies for all
  to authenticated
  using (public.auth_user_role() = 'superadmin');

create policy "Users can view their own society"
  on public.societies for select
  to authenticated
  using (id = public.auth_user_society_id());

create policy "Admins can update their own society"
  on public.societies for update
  to authenticated
  using (
    id = public.auth_user_society_id() 
    AND public.auth_user_role() = 'admin'
  );

-- Profiles policies
create policy "Super Admins have full access to profiles"
  on public.profiles for all
  to authenticated
  using (public.auth_user_role() = 'superadmin');

create policy "Authenticated users can view profiles in their society"
  on public.profiles for select
  to authenticated
  using (society_id = public.auth_user_society_id() OR id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Admins can update profiles in their society"
  on public.profiles for update
  to authenticated
  using (
    public.auth_user_role() in ('admin', 'committee')
    AND society_id = public.auth_user_society_id()
  );

create policy "Admins can insert profiles in their society"
  on public.profiles for insert
  to authenticated
  with check (
    public.auth_user_role() in ('admin')
    AND society_id = public.auth_user_society_id()
  );


-- Automatic handle_new_user trigger
create or replace function public.handle_new_user()
returns trigger as $$
DECLARE
  v_role text;
  v_society_id uuid;
BEGIN
  -- Handle the initial Super Admin Bootstrap
  IF new.email = 'bhavik191989@gmail.com' THEN
    v_role := 'superadmin';
    v_society_id := NULL;
  ELSE
    -- For everyone else, they MUST be invited with meta_data specifying role and society_id.
    v_role := new.raw_user_meta_data->>'role';
    v_society_id := (new.raw_user_meta_data->>'society_id')::uuid;

    -- If no role is provided, default to resident
    IF v_role IS NULL THEN
      v_role := 'resident';
    END IF;

    -- If a non-superadmin is trying to sign up without an invite/society_id, reject them.
    IF v_role != 'superadmin' AND v_society_id IS NULL THEN
      RAISE EXCEPTION 'Non-superadmin users must be invited to a specific society.';
    END IF;
    
    -- If a superadmin invite was sent, ensure society_id is null
    IF v_role = 'superadmin' THEN
      v_society_id := NULL;
    END IF;
  END IF;

  insert into public.profiles (id, email, full_name, phone, role, society_id, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    v_role,
    v_society_id,
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 4. Create Towers Table
create table if not exists public.towers (
  id uuid primary key default gen_random_uuid(),
  society_id uuid references public.societies(id) on delete cascade not null,
  name text not null,
  structure_type text default 'tower',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create Flats Table
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

-- 6. Create Flat Residents mapping table
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

-- 7. Create Notices Table
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  society_id uuid references public.societies(id) on delete cascade not null,
  title text not null,
  body text not null,
  is_emergency boolean default false,
  author_id uuid references public.profiles(id) on delete set null,
  category text default 'General',
  pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Database Triggers for Multi-Tenancy (Auto-inject society_id)
CREATE OR REPLACE FUNCTION public.set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- SuperAdmins shouldn't be inserting directly into these tables without explicitly defining society_id.
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

-- Tenant Isolation Policies (Super Admins bypass this)
create policy "Tenant isolation for towers" on public.towers for all to authenticated 
using (
  society_id = public.auth_user_society_id() OR
  public.auth_user_role() = 'superadmin'
);

create policy "Tenant isolation for flats" on public.flats for all to authenticated 
using (
  society_id = public.auth_user_society_id() OR
  public.auth_user_role() = 'superadmin'
);

create policy "Tenant isolation for flat_residents" on public.flat_residents for all to authenticated 
using (
  society_id = public.auth_user_society_id() OR
  public.auth_user_role() = 'superadmin'
);

create policy "Tenant isolation for notices" on public.notices for all to authenticated 
using (
  society_id = public.auth_user_society_id() OR
  public.auth_user_role() = 'superadmin'
);
