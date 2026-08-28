begin;

create extension if not exists pgcrypto;

create type public.brandex_role as enum ('viewer', 'editor', 'admin');
create type public.file_category as enum ('logo', 'application', 'tm5', 'tm6', 'tm11', 'tm16', 'tm56', 'journal', 'other');
create type public.sheet_sync_action as enum ('upsert', 'delete');
create type public.sheet_sync_state as enum ('pending', 'processing', 'synced', 'failed');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.brandex_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  code text primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trademarks (
  id text primary key default gen_random_uuid()::text,
  filing_date date not null default current_date,
  type text not null check (type in ('X', 'A', 'N')),
  client_code text not null,
  client_name text,
  case_number text not null,
  application_name text not null,
  tm_cpr_number text,
  nice_class text,
  status text not null default 'STAGE 1',
  sub_status text,
  case_type text,
  agent text,
  city text not null,
  notes text,
  tm5 boolean not null default false,
  tm6 boolean not null default false,
  tm11 boolean not null default false,
  tm16 boolean not null default false,
  tm56 boolean not null default false,
  journal_number text,
  journal_date date,
  journal_data jsonb,
  logo_path text,
  legacy_image_url text,
  source_sheet_row integer,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (type, client_code, case_number)
);

create index trademarks_updated_at_idx on public.trademarks (updated_at desc);
create index trademarks_tm_number_idx on public.trademarks (tm_cpr_number);
create index trademarks_client_code_idx on public.trademarks (client_code);
create index trademarks_status_idx on public.trademarks (status);
create index trademarks_agent_idx on public.trademarks (agent);
create index trademarks_city_idx on public.trademarks (city);
create index trademarks_application_name_search_idx on public.trademarks using gin (to_tsvector('simple', application_name));

create table public.trademark_files (
  id uuid primary key default gen_random_uuid(),
  trademark_id text not null references public.trademarks(id) on delete cascade,
  category public.file_category not null default 'other',
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0 and size_bytes <= 10485760),
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index trademark_files_record_idx on public.trademark_files (trademark_id, category);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  trademark_id text,
  action text not null check (action in ('CREATE', 'UPDATE', 'DELETE')),
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now(),
  old_record jsonb,
  new_record jsonb
);

create index audit_logs_changed_at_idx on public.audit_logs (changed_at desc);
create index audit_logs_record_idx on public.audit_logs (trademark_id, changed_at desc);

create table public.sheet_sync_outbox (
  id bigint generated always as identity primary key,
  trademark_id text not null,
  action public.sheet_sync_action not null,
  payload jsonb,
  state public.sheet_sync_state not null default 'pending',
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index sheet_sync_pending_idx on public.sheet_sync_outbox (state, created_at)
  where state in ('pending', 'failed');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_brandex_role()
returns public.brandex_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where user_id = auth.uid()),
    'viewer'::public.brandex_role
  );
$$;

create or replace function public.set_updated_metadata()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  new.version = old.version + 1;
  new.updated_by = auth.uid();
  return new;
end;
$$;

create or replace function public.audit_and_queue_trademark()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  record_id text;
  audit_action text;
begin
  record_id := coalesce(new.id, old.id);
  audit_action := case tg_op when 'INSERT' then 'CREATE' when 'UPDATE' then 'UPDATE' else 'DELETE' end;

  insert into public.audit_logs (trademark_id, action, changed_by, old_record, new_record)
  values (
    record_id,
    audit_action,
    auth.uid(),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  insert into public.sheet_sync_outbox (trademark_id, action, payload)
  values (
    record_id,
    case when tg_op = 'DELETE' then 'delete'::public.sheet_sync_action else 'upsert'::public.sheet_sync_action end,
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger trademarks_set_updated_metadata
before update on public.trademarks
for each row execute function public.set_updated_metadata();

create trigger trademarks_audit_and_sync
after insert or update or delete on public.trademarks
for each row execute function public.audit_and_queue_trademark();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.trademarks enable row level security;
alter table public.trademark_files enable row level security;
alter table public.audit_logs enable row level security;
alter table public.sheet_sync_outbox enable row level security;

create policy "staff can read own profile" on public.profiles
for select to authenticated using (user_id = auth.uid() or public.current_brandex_role() = 'admin');

create policy "authenticated staff can read clients" on public.clients
for select to authenticated using (true);
create policy "editors manage clients" on public.clients
for all to authenticated
using (public.current_brandex_role() in ('editor', 'admin'))
with check (public.current_brandex_role() in ('editor', 'admin'));

create policy "authenticated staff can read trademarks" on public.trademarks
for select to authenticated using (true);
create policy "editors create trademarks" on public.trademarks
for insert to authenticated
with check (public.current_brandex_role() in ('editor', 'admin'));
create policy "editors update trademarks" on public.trademarks
for update to authenticated
using (public.current_brandex_role() in ('editor', 'admin'))
with check (public.current_brandex_role() in ('editor', 'admin'));
create policy "admins delete trademarks" on public.trademarks
for delete to authenticated
using (public.current_brandex_role() = 'admin');

create policy "authenticated staff can read files" on public.trademark_files
for select to authenticated using (true);
create policy "editors manage file metadata" on public.trademark_files
for all to authenticated
using (public.current_brandex_role() in ('editor', 'admin'))
with check (public.current_brandex_role() in ('editor', 'admin'));

create policy "authenticated staff can read audit logs" on public.audit_logs
for select to authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trademark-files',
  'trademark-files',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "staff can view trademark storage" on storage.objects
for select to authenticated using (bucket_id = 'trademark-files');
create policy "editors upload trademark storage" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'trademark-files'
  and public.current_brandex_role() in ('editor', 'admin')
);
create policy "editors update trademark storage" on storage.objects
for update to authenticated
using (
  bucket_id = 'trademark-files'
  and public.current_brandex_role() in ('editor', 'admin')
);
create policy "admins delete trademark storage" on storage.objects
for delete to authenticated
using (
  bucket_id = 'trademark-files'
  and public.current_brandex_role() = 'admin'
);

commit;
