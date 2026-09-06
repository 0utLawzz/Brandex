begin;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.related_form_entries to authenticated;
grant select on table public.journal_publications to authenticated;

alter table public.related_form_entries enable row level security;

drop policy if exists related_form_auth_select on public.related_form_entries;
drop policy if exists related_form_auth_insert on public.related_form_entries;
drop policy if exists related_form_auth_update on public.related_form_entries;
drop policy if exists related_form_auth_delete on public.related_form_entries;

create policy related_form_auth_select on public.related_form_entries
  for select to authenticated
  using ((select auth.uid()) is not null);

create policy related_form_auth_insert on public.related_form_entries
  for insert to authenticated
  with check ((select auth.uid()) is not null);

create policy related_form_auth_update on public.related_form_entries
  for update to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy related_form_auth_delete on public.related_form_entries
  for delete to authenticated
  using ((select auth.uid()) is not null);

notify pgrst, 'reload schema';

commit;
