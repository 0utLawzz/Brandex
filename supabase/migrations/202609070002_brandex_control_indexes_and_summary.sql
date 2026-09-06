-- Brandex workflow/control hardening.
-- The live project already contains the trademarks/workflow tables; this migration
-- only adds indexes and read-only summary functions used by the UI.

create index if not exists idx_trademarks_prefix_client_case
  on public.trademarks(prefix, client_code, case_number);
create index if not exists idx_trademarks_status
  on public.trademarks(status, sub_status);
create index if not exists idx_trademarks_tm_cpr
  on public.trademarks(tm_cpr_number);
create index if not exists idx_trademarks_agent
  on public.trademarks(agent);
create index if not exists idx_trademarks_condition
  on public.trademarks(condition, is_prolonged);
create index if not exists idx_stage_events_application_stage
  on public.trademark_stage_events(application_id, stage, started_at desc);
create index if not exists idx_journal_publications_month
  on public.journal_publications(publication_date, journal_no);
create index if not exists idx_agent_assignments_agent_status
  on public.agent_assignments(agent_name, response_status, assigned_at desc);

create or replace function public.brandex_dashboard_summary()
returns jsonb
language sql stable security invoker
set search_path = public, pg_temp
as $$
select jsonb_build_object(
  'total', (select count(*) from public.trademarks),
  'tm5', (select count(*) from public.trademarks where tm5),
  'tm6', (select count(*) from public.trademarks where tm6),
  'tm11', (select count(*) from public.trademarks where tm11),
  'tm16', (select count(*) from public.trademarks where tm16),
  'tm56', (select count(*) from public.trademarks where tm56),
  'prolonged', (select count(*) from public.trademarks where is_prolonged or condition <> 'NORMAL'),
  'by_status', coalesce((select jsonb_agg(x) from (
    select status, count(*) as count from public.trademarks group by status order by status
  ) x), '[]'::jsonb),
  'agents', coalesce((select jsonb_agg(x) from (
    select agent_name, count(*) as total,
      count(*) filter (where response_status='ACCEPTED') as accepted,
      count(*) filter (where response_status='REJECTED') as rejected,
      count(*) filter (where response_status='COMPLETED') as completed
    from public.agent_assignments group by agent_name order by agent_name
  ) x), '[]'::jsonb)
);
$$;

grant execute on function public.brandex_dashboard_summary() to authenticated;

-- Public lookup remains deliberately exact-match and returns only client-safe fields.
create or replace function public.brandex_public_search(p_tm_number text)
returns table(
  tm_cpr_number text,
  application_name text,
  status text,
  sub_status text,
  filing_date date,
  journal_number text,
  journal_date date,
  current_stage integer,
  condition text
)
language sql stable security definer
set search_path = public, pg_temp
as $$
select t.tm_cpr_number, t.application_name, t.status, t.sub_status,
       t.filing_date, t.journal_number, t.journal_date,
       case t.status
         when 'STAGE 1' then 1 when 'STAGE 2' then 2 when 'STAGE 3' then 3
         when 'STAGE 4' then 4 when 'STAGE 5' then 5 else 0
       end,
       t.condition
from public.trademarks t
where nullif(trim(p_tm_number), '') is not null
  and lower(t.tm_cpr_number) = lower(trim(p_tm_number))
limit 1;
$$;

revoke all on function public.brandex_public_search(text) from public;
grant execute on function public.brandex_public_search(text) to anon, authenticated;
