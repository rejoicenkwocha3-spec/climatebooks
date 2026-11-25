-- ClimateBooks schema. Run once in the Supabase SQL editor (or via the CLI).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS.

create extension if not exists pgcrypto;

-- ───────── Profiles ─────────
create table if not exists public.cb_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  job_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.cb_handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.cb_profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists cb_on_auth_user_created on auth.users;
create trigger cb_on_auth_user_created after insert on auth.users
  for each row execute function public.cb_handle_new_user();

-- Backfill profiles for users that already exist in this shared Supabase project
-- (run after the cb_profiles table is created; placed below)
-- ───────── Organisations & membership ─────────
create table if not exists public.cb_organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  country text,
  boundary_approach text not null default 'operational_control'
    check (boundary_approach in ('operational_control','financial_control','equity_share')),
  boundary_notes text,
  base_year int,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.cb_organisation_members (
  organisation_id uuid not null references public.cb_organisations(id) on delete cascade,
  user_id uuid not null references public.cb_profiles(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner','admin','editor','viewer')),
  created_at timestamptz not null default now(),
  primary key (organisation_id, user_id)
);

insert into public.cb_profiles (id, email) select id, email from auth.users on conflict (id) do nothing;

create or replace function public.cb_is_member(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from cb_organisation_members where organisation_id = org and user_id = auth.uid());
$$;
create or replace function public.cb_has_role(org uuid, roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from cb_organisation_members
    where organisation_id = org and user_id = auth.uid() and role = any(roles));
$$;

-- creator becomes owner automatically
create or replace function public.cb_add_creator_as_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.cb_profiles (id, email) select id, email from auth.users where id = new.created_by on conflict (id) do nothing;
  insert into cb_organisation_members (organisation_id, user_id, role) values (new.id, new.created_by, 'owner');
  return new;
end $$;
drop trigger if exists org_creator_owner on public.cb_organisations;
create trigger org_creator_owner after insert on public.cb_organisations
  for each row execute function public.cb_add_creator_as_owner();

-- ───────── Org structure ─────────
create table if not exists public.cb_locations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.cb_organisations(id) on delete cascade,
  name text not null, country text, address text, created_at timestamptz not null default now()
);
create table if not exists public.cb_departments (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.cb_organisations(id) on delete cascade,
  name text not null, created_at timestamptz not null default now()
);
create table if not exists public.cb_reporting_periods (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.cb_organisations(id) on delete cascade,
  label text not null, start_date date not null, end_date date not null,
  due_date date, status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

-- ───────── Emission factors ─────────
-- organisation_id NULL = shared library (writable only with the service role).
create table if not exists public.cb_emission_factors (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.cb_organisations(id) on delete cascade,
  name text not null,
  category text not null,
  scope smallint check (scope in (1,2,3)),
  unit text not null,
  kgco2e_per_unit numeric not null check (kgco2e_per_unit >= 0),
  source text not null,
  publication_year int not null,
  geography text not null default 'Global',
  version text not null default '1',
  methodology text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ───────── Suppliers ─────────
create table if not exists public.cb_suppliers (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.cb_organisations(id) on delete cascade,
  name text not null, contact_email text, country text, category text,
  status text not null default 'invited' check (status in ('invited','requested','submitted','reviewed','rejected')),
  created_at timestamptz not null default now()
);
create table if not exists public.cb_supplier_submissions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.cb_organisations(id) on delete cascade,
  supplier_id uuid not null references public.cb_suppliers(id) on delete cascade,
  period_id uuid references public.cb_reporting_periods(id) on delete set null,
  reported_kgco2e numeric, methodology text, notes text,
  status text not null default 'submitted' check (status in ('requested','submitted','approved','rejected')),
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ───────── Activity data & calculations ─────────
create table if not exists public.cb_activity_records (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.cb_organisations(id) on delete cascade,
  period_id uuid references public.cb_reporting_periods(id) on delete set null,
  location_id uuid references public.cb_locations(id) on delete set null,
  department_id uuid references public.cb_departments(id) on delete set null,
  supplier_id uuid references public.cb_suppliers(id) on delete set null,
  scope smallint not null check (scope in (1,2,3)),
  scope3_category smallint check (scope3_category between 1 and 15),
  category text not null,
  description text,
  activity_date date not null default current_date,
  quantity numeric not null check (quantity >= 0),
  unit text not null,
  factor_id uuid references public.cb_emission_factors(id),
  data_quality text not null default 'estimated' check (data_quality in ('measured','calculated','estimated','assumed')),
  verification_status text not null default 'unverified' check (verification_status in ('unverified','internally_reviewed','third_party_verified')),
  created_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

-- One calculation row per activity record: the audit trail of Emissions = Activity x Factor.
create table if not exists public.cb_emissions_calculations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.cb_organisations(id) on delete cascade,
  activity_id uuid not null unique references public.cb_activity_records(id) on delete cascade,
  input_quantity numeric not null, input_unit text not null,
  converted_quantity numeric not null, factor_unit text not null,
  factor_value numeric not null, factor_source text not null,
  factor_publication_year int, factor_geography text, factor_version text,
  methodology text not null default 'Activity data x emission factor (GHG Protocol)',
  result_kgco2e numeric not null,
  calculated_by uuid default auth.uid() references auth.users(id),
  calculated_at timestamptz not null default now()
);

-- Scope views (respect RLS of the caller)
create or replace view public.cb_scope1_records with (security_invoker = true) as
  select * from public.cb_activity_records where scope = 1;
create or replace view public.cb_scope2_records with (security_invoker = true) as
  select * from public.cb_activity_records where scope = 2;
create or replace view public.cb_scope3_records with (security_invoker = true) as
  select * from public.cb_activity_records where scope = 3;

-- ───────── Targets, initiatives ─────────
create table if not exists public.cb_climate_targets (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.cb_organisations(id) on delete cascade,
  name text not null,
  target_type text not null default 'reduction' check (target_type in ('reduction','net_zero')),
  scope_coverage text not null default 'all',
  baseline_year int not null, target_year int not null,
  reduction_percent numeric not null check (reduction_percent between 0 and 100),
  notes text, created_at timestamptz not null default now(),
  check (target_year > baseline_year)
);
create table if not exists public.cb_reduction_initiatives (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.cb_organisations(id) on delete cascade,
  target_id uuid references public.cb_climate_targets(id) on delete set null,
  title text not null, description text,
  expected_reduction_kgco2e numeric, status text not null default 'planned'
    check (status in ('planned','in_progress','completed','cancelled')),
  due_date date, basis text not null default 'estimated' check (basis in ('estimated','modelled','measured')),
  created_at timestamptz not null default now()
);

-- ───────── Reports, cb_documents, cb_notifications ─────────
create table if not exists public.cb_reports (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.cb_organisations(id) on delete cascade,
  period_id uuid references public.cb_reporting_periods(id) on delete set null,
  title text not null,
  framework text not null default 'GHG Protocol',
  status text not null default 'draft' check (status in ('draft','in_review','final')),
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.cb_documents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.cb_organisations(id) on delete cascade,
  name text not null, storage_path text not null, size_bytes bigint, mime_type text,
  uploaded_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.cb_notifications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.cb_organisations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null, body text, is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────── Subscriptions (written ONLY by the verified webhook, service role) ─────────
create table if not exists public.cb_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  buyer_email text not null,
  plan_key text not null check (plan_key in ('plan_1','plan_2','plan_3')),
  status text not null default 'active' check (status in ('active','cancelled','expired')),
  selar_reference text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cb_audit_logs (
  id bigserial primary key,
  organisation_id uuid, user_id uuid default auth.uid(),
  table_name text not null, record_id text, action text not null,
  old_data jsonb, new_data jsonb, created_at timestamptz not null default now()
);

create or replace function public.cb_audit_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
declare rec jsonb; org uuid;
begin
  rec := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  org := nullif(rec->>'organisation_id','')::uuid;
  insert into cb_audit_logs (organisation_id, user_id, table_name, record_id, action, old_data, new_data)
  values (org, auth.uid(), tg_table_name, rec->>'id', tg_op,
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['cb_activity_records','cb_emissions_calculations','cb_emission_factors','cb_climate_targets',
    'cb_reduction_initiatives','cb_reports','cb_suppliers','cb_supplier_submissions','cb_organisation_members','cb_organisations']
  loop
    execute format('drop trigger if exists audit_%1$s on public.%1$s', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$s
                    for each row execute function public.cb_audit_trigger()', t);
  end loop;
end $$;

-- ───────── Indexes ─────────
create index if not exists cb_idx_activity_org on public.cb_activity_records (organisation_id, period_id);
create index if not exists cb_idx_calc_org on public.cb_emissions_calculations (organisation_id);
create index if not exists cb_idx_factors_org on public.cb_emission_factors (organisation_id);
create index if not exists cb_idx_members_user on public.cb_organisation_members (user_id);

-- ───────── Row Level Security ─────────
alter table public.cb_profiles enable row level security;
drop policy if exists profiles_select on public.cb_profiles;
drop policy if exists profiles_update on public.cb_profiles;
create policy profiles_select on public.cb_profiles for select using (
  id = auth.uid() or exists (select 1 from cb_organisation_members a join cb_organisation_members b
    on a.organisation_id = b.organisation_id where a.user_id = auth.uid() and b.user_id = cb_profiles.id));
create policy profiles_update on public.cb_profiles for update using (id = auth.uid()) with check (id = auth.uid());

alter table public.cb_organisations enable row level security;
drop policy if exists org_select on public.cb_organisations;
drop policy if exists org_insert on public.cb_organisations;
drop policy if exists org_update on public.cb_organisations;
drop policy if exists org_delete on public.cb_organisations;
create policy org_select on public.cb_organisations for select using (cb_is_member(id) or created_by = auth.uid());
create policy org_insert on public.cb_organisations for insert with check (created_by = auth.uid());
create policy org_update on public.cb_organisations for update using (cb_has_role(id, array['owner','admin']));
create policy org_delete on public.cb_organisations for delete using (cb_has_role(id, array['owner']));

alter table public.cb_organisation_members enable row level security;
drop policy if exists mem_select on public.cb_organisation_members;
drop policy if exists mem_insert on public.cb_organisation_members;
drop policy if exists mem_update on public.cb_organisation_members;
drop policy if exists mem_delete on public.cb_organisation_members;
create policy mem_select on public.cb_organisation_members for select using (cb_is_member(organisation_id));
create policy mem_insert on public.cb_organisation_members for insert with check (cb_has_role(organisation_id, array['owner','admin']));
create policy mem_update on public.cb_organisation_members for update using (cb_has_role(organisation_id, array['owner','admin']));
create policy mem_delete on public.cb_organisation_members for delete using
  (cb_has_role(organisation_id, array['owner','admin']) or user_id = auth.uid());

-- Generic org-scoped tables: members read, owner/admin/editor write.
do $$
declare t text;
begin
  foreach t in array array['cb_locations','cb_departments','cb_reporting_periods','cb_activity_records',
    'cb_emissions_calculations','cb_suppliers','cb_supplier_submissions','cb_climate_targets',
    'cb_reduction_initiatives','cb_reports','cb-documents']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format('drop policy if exists %1$s_write on public.%1$s', t);
    execute format('create policy %1$s_select on public.%1$s for select using (cb_is_member(organisation_id))', t);
    execute format('create policy %1$s_write on public.%1$s for all
      using (cb_has_role(organisation_id, array[''owner'',''admin'',''editor'']))
      with check (cb_has_role(organisation_id, array[''owner'',''admin'',''editor'']))', t);
  end loop;
end $$;

alter table public.cb_emission_factors enable row level security;
drop policy if exists ef_select on public.cb_emission_factors;
drop policy if exists ef_write on public.cb_emission_factors;
create policy ef_select on public.cb_emission_factors for select
  using (organisation_id is null or cb_is_member(organisation_id));
create policy ef_write on public.cb_emission_factors for all
  using (organisation_id is not null and cb_has_role(organisation_id, array['owner','admin','editor']))
  with check (organisation_id is not null and cb_has_role(organisation_id, array['owner','admin','editor']));

alter table public.cb_notifications enable row level security;
drop policy if exists notif_select on public.cb_notifications;
drop policy if exists notif_update on public.cb_notifications;
create policy notif_select on public.cb_notifications for select
  using (user_id = auth.uid() or (organisation_id is not null and cb_is_member(organisation_id)));
create policy notif_update on public.cb_notifications for update using (user_id = auth.uid());

alter table public.cb_subscriptions enable row level security;
drop policy if exists sub_select on public.cb_subscriptions;
create policy sub_select on public.cb_subscriptions for select
  using (user_id = auth.uid() or buyer_email = (select email from auth.users where id = auth.uid()));
-- no insert/update/delete policies: only the service role (webhook) can write.

alter table public.cb_audit_logs enable row level security;
drop policy if exists audit_select on public.cb_audit_logs;
create policy audit_select on public.cb_audit_logs for select
  using (organisation_id is not null and cb_has_role(organisation_id, array['owner','admin']));

-- ───────── Storage: private bucket, path = <organisation_id>/<file> ─────────
insert into storage.buckets (id, name, public) values ('cb-documents','cb-documents', false)
  on conflict (id) do nothing;
drop policy if exists cb_docs_read on storage.objects;
drop policy if exists cb_docs_write on storage.objects;
drop policy if exists cb_docs_delete on storage.objects;
create policy cb_docs_read on storage.objects for select using (
  bucket_id = 'cb-documents' and cb_is_member(((storage.foldername(name))[1])::uuid));
create policy cb_docs_write on storage.objects for insert with check (
  bucket_id = 'cb-documents' and cb_has_role(((storage.foldername(name))[1])::uuid, array['owner','admin','editor']));
create policy cb_docs_delete on storage.objects for delete using (
  bucket_id = 'cb-documents' and cb_has_role(((storage.foldername(name))[1])::uuid, array['owner','admin','editor']));

-- ───────── Realtime ─────────
do $$ begin
  alter publication supabase_realtime add table public.cb_activity_records;
  exception when others then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.cb_notifications;
  exception when others then null;
end $$;

-- Add an existing ClimateBooks user to an organisation by email (owner/admin only).
create or replace function public.cb_add_member_by_email(org uuid, member_email text, member_role text)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not cb_has_role(org, array['owner','admin']) then return 'You do not have permission to manage this team.'; end if;
  if member_role not in ('admin','editor','viewer') then return 'Invalid role.'; end if;
  select id into uid from cb_profiles where lower(email) = lower(trim(member_email));
  if uid is null then return 'No ClimateBooks account exists for that email. Ask them to sign up first.'; end if;
  insert into cb_organisation_members (organisation_id, user_id, role) values (org, uid, member_role)
    on conflict (organisation_id, user_id) do update set role = excluded.role
    where cb_organisation_members.role <> 'owner';
  insert into cb_notifications (organisation_id, user_id, title, body)
    values (org, uid, 'You were added to an organisation', 'You now have ' || member_role || ' access.');
  return 'ok';
end $$;
revoke all on function public.cb_add_member_by_email(uuid, text, text) from public, anon;
grant execute on function public.cb_add_member_by_email(uuid, text, text) to authenticated;
