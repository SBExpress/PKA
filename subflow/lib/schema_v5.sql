-- Run this in your Supabase SQL editor

-- Add header/title and send-to fields to rfqs
alter table rfqs add column if not exists header text;
alter table rfqs add column if not exists vendor_name text;
alter table rfqs add column if not exists vendor_contact text;
alter table rfqs add column if not exists vendor_email text;
alter table rfqs add column if not exists due_date date;
alter table rfqs add column if not exists quoted_amount numeric(12,2);
alter table rfqs add column if not exists updated_at timestamptz default now();

-- Drop old status constraint and re-add with received option
alter table rfqs drop constraint if exists rfqs_status_check;
alter table rfqs add constraint rfqs_status_check check (status in ('draft','sent','received'));

-- Add header, send-to, and response fields to rfis
alter table rfis add column if not exists header text;
alter table rfis add column if not exists sent_to_name text;
alter table rfis add column if not exists sent_to_contact text;
alter table rfis add column if not exists sent_to_email text;
alter table rfis add column if not exists response text;
alter table rfis add column if not exists updated_at timestamptz default now();
