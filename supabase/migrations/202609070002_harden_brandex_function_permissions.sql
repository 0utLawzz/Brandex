begin;

alter function public.set_updated_at() set search_path = public;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.write_trademark_audit() from public, anon, authenticated;
revoke execute on function public.brandex_record_history(text) from public, anon;
revoke execute on function public.brandex_public_search(text) from authenticated;
notify pgrst, 'reload schema';

commit;
