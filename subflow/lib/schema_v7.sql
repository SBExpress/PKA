-- Run this in your Supabase SQL editor to set up the database
-- Version 7: Add address field to companies and create contacts table

-- Update Companies table to include address
alter table companies add column if not exists address text;
alter table companies add column if not exists address_lat numeric(10, 8);
alter table companies add column if not exists address_lng numeric(11, 8);

-- Create Contacts table
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  title text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security for contacts
alter table contacts enable row level security;

-- RLS Policy for contacts
drop policy if exists "own contacts" on contacts;
create policy "own contacts" on contacts for all using (auth.uid() = user_id);
