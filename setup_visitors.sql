-- 9. Create Visitors Table
create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  society_id uuid references public.societies(id) on delete cascade not null,
  visitor_name text not null,
  purpose text not null,
  phone text,
  vehicle_type text check (vehicle_type in ('None', 'Car', 'Two Wheeler')) default 'None',
  person_count integer default 1,
  status text check (status in ('pending', 'approved', 'denied', 'checked_out')) default 'pending',
  exit_time timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TRIGGER set_tenant_visitors BEFORE INSERT ON public.visitors FOR EACH ROW EXECUTE PROCEDURE public.set_tenant_id();

alter table public.visitors enable row level security;

create policy "Tenant isolation for visitors" on public.visitors for all to authenticated 
using (
  society_id = public.auth_user_society_id() OR
  public.auth_user_role() = 'superadmin'
);
