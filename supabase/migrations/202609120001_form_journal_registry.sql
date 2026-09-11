-- Form registry + journal registry for admin CSV import and TM-number matching.
-- Run after 202608280001_brandex_datasheet.sql

begin;

-- ---------------------------------------------------------------------------
-- form_registry: one row per IPO form event (TM5 / TM6 / TM11 / TM16 / TM56)
-- Spreadsheet columns: serial, office, TM number, class, type, status, date
-- ---------------------------------------------------------------------------
create table if not exists public.form_registry (
  id              uuid primary key default gen_random_uuid(),
  serial_number   text not null default '',
  office          text,
  tm_number       text not null,
  tm_number_norm  text not null,           -- digits-only for matching
  nice_class      text,
  form_type       text not null
                  check (form_type in ('tm5','tm6','tm11','tm16','tm56')),
  status          text,
  form_date       date,                     -- column G only
  source_row      integer,
  imported_at     timestamptz not null default now(),
  imported_by     uuid references auth.users(id),
  raw             jsonb,
  constraint form_registry_dedupe unique (tm_number_norm, form_type, form_date, serial_number)
);

create index if not exists form_registry_tm_norm_idx
  on public.form_registry (tm_number_norm);
create index if not exists form_registry_form_type_idx
  on public.form_registry (form_type);

-- ---------------------------------------------------------------------------
-- journal_registry: IPO journal publication rows
-- Columns: Journal No, Journal Date, Application No (TM), Class,
--          Applicant, Agent, Date of Filing, Generated Doc
-- ---------------------------------------------------------------------------
create table if not exists public.journal_registry (
  id                  uuid primary key default gen_random_uuid(),
  journal_no          text not null default '',
  journal_date        date,
  application_no      text not null,         -- TM number
  application_no_norm text not null,
  nice_class          text,
  applicant           text,
  agent               text,
  date_of_filing      date,
  generated_doc       text,
  source_row          integer,
  imported_at         timestamptz not null default now(),
  imported_by         uuid references auth.users(id),
  raw                 jsonb,
  constraint journal_registry_dedupe unique (application_no_norm, journal_no, journal_date)
);

create index if not exists journal_registry_app_norm_idx
  on public.journal_registry (application_no_norm);
create index if not exists journal_registry_journal_no_idx
  on public.journal_registry (journal_no);

-- ---------------------------------------------------------------------------
-- RLS: staff read; admin write
-- ---------------------------------------------------------------------------
alter table public.form_registry enable row level security;
alter table public.journal_registry enable row level security;

drop policy if exists "staff read form_registry" on public.form_registry;
create policy "staff read form_registry" on public.form_registry
  for select to authenticated using (true);

drop policy if exists "admin write form_registry" on public.form_registry;
create policy "admin write form_registry" on public.form_registry
  for all to authenticated
  using (public.current_brandex_role() = 'admin')
  with check (public.current_brandex_role() = 'admin');

drop policy if exists "staff read journal_registry" on public.journal_registry;
create policy "staff read journal_registry" on public.journal_registry
  for select to authenticated using (true);

drop policy if exists "admin write journal_registry" on public.journal_registry;
create policy "admin write journal_registry" on public.journal_registry
  for all to authenticated
  using (public.current_brandex_role() = 'admin')
  with check (public.current_brandex_role() = 'admin');

commit;
