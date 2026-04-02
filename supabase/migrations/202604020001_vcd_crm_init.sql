create extension if not exists "uuid-ossp" with schema extensions;

create table if not exists public.tenants (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  full_name text not null,
  role text not null default 'user' check (role in ('admin', 'user'))
);

create table if not exists public.pipelines (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null
);

create table if not exists public.stages (
  id uuid primary key default extensions.uuid_generate_v4(),
  pipeline_id uuid not null references public.pipelines (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  position integer not null
);

create table if not exists public.leads (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  stage_id uuid references public.stages (id) on delete set null,
  name text not null,
  phone text,
  email text,
  value numeric(10, 2) not null default 0,
  assigned_to uuid references public.users (id) on delete set null,
  last_interaction_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  content text,
  created_at timestamptz not null default now()
);

create index if not exists users_tenant_id_idx on public.users (tenant_id);
create index if not exists pipelines_tenant_id_idx on public.pipelines (tenant_id);
create index if not exists stages_pipeline_position_idx on public.stages (pipeline_id, position);
create index if not exists stages_tenant_id_idx on public.stages (tenant_id);
create index if not exists leads_tenant_stage_idx on public.leads (tenant_id, stage_id);
create index if not exists leads_last_interaction_idx on public.leads (tenant_id, last_interaction_at desc);
create index if not exists messages_tenant_lead_idx on public.messages (tenant_id, lead_id, created_at desc);

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
as $$
  select tenant_id
  from public.users
  where id = auth.uid()
$$;

create or replace function public.is_tenant_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  )
$$;

alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.pipelines enable row level security;
alter table public.stages enable row level security;
alter table public.leads enable row level security;
alter table public.messages enable row level security;

drop policy if exists "tenants_select_own" on public.tenants;
create policy "tenants_select_own"
on public.tenants
for select
using (id = public.current_tenant_id());

drop policy if exists "users_select_same_tenant" on public.users;
create policy "users_select_same_tenant"
on public.users
for select
using (tenant_id = public.current_tenant_id());

drop policy if exists "users_manage_same_tenant_as_admin" on public.users;
create policy "users_manage_same_tenant_as_admin"
on public.users
for all
using (
  tenant_id = public.current_tenant_id()
  and public.is_tenant_admin()
)
with check (
  tenant_id = public.current_tenant_id()
  and public.is_tenant_admin()
);

drop policy if exists "pipelines_isolated_by_tenant" on public.pipelines;
create policy "pipelines_isolated_by_tenant"
on public.pipelines
for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "stages_isolated_by_tenant" on public.stages;
create policy "stages_isolated_by_tenant"
on public.stages
for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "leads_isolated_by_tenant" on public.leads;
create policy "leads_isolated_by_tenant"
on public.leads
for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "messages_isolated_by_tenant" on public.messages;
create policy "messages_isolated_by_tenant"
on public.messages
for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

alter table public.leads replica identity full;
alter table public.messages replica identity full;

alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.messages;
