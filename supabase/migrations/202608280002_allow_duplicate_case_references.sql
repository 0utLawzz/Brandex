begin;

-- Legacy Sheets contain valid separate records that share the same series,
-- client code, and case number. The immutable record ID is the unique key.
alter table public.trademarks
  drop constraint if exists trademarks_type_client_code_case_number_key;

create index if not exists trademarks_case_reference_idx
  on public.trademarks (type, client_code, case_number);

commit;
