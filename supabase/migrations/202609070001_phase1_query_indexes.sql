begin;

-- Canonical Datasheet order and frequently used operational filters.
create index if not exists trademarks_datasheet_order_idx
  on public.trademarks (type, client_code, case_number);
create index if not exists trademarks_filing_date_idx
  on public.trademarks (filing_date);
create index if not exists trademarks_sub_status_idx
  on public.trademarks (sub_status);
create index if not exists trademarks_nice_class_idx
  on public.trademarks (nice_class);
create index if not exists trademarks_case_type_idx
  on public.trademarks (case_type);

-- Partial indexes keep count-only TM control queries small.
create index if not exists trademarks_tm5_true_idx on public.trademarks (id) where tm5;
create index if not exists trademarks_tm6_true_idx on public.trademarks (id) where tm6;
create index if not exists trademarks_tm11_true_idx on public.trademarks (id) where tm11;
create index if not exists trademarks_tm16_true_idx on public.trademarks (id) where tm16;
create index if not exists trademarks_tm56_true_idx on public.trademarks (id) where tm56;

commit;
