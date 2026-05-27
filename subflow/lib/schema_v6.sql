-- Run this in your Supabase SQL editor to set up the database
-- Version 6: Add Contacts table and update RFQ/RFI to use contacts

-- Bid Requests (updated with company_id reference)
create table if not exists bid_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  project_name text not null,
  project_address text,
  customer_name text,
  customer_company text,
  customer_email text,
  customer_phone text,
  bid_due_date date,
  received_date date default current_date,
  status text default 'received' check (status in ('received','in_progress','submitted','declined','awarded','lost')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Proposals (unchanged)
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  bid_request_id uuid references bid_requests(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  revision integer default 1,
  date date default current_date,
  cover_letter text,
  total_price numeric(12,2),
  drawings_used text,
  detailed_description text,
  clarifications text,
  work_not_included text,
  terms text,
  alternates jsonb default '[]',
  price_breakdown jsonb default '[]',
  status text default 'draft' check (status in ('draft','sent','signed','declined')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- NEW: Companies table for RFQ vendors and RFI customers
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  type text not null check (type in ('customer', 'vendor', 'both')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RFQs - Updated to reference companies
create table if not exists rfqs (
  id uuid primary key default gen_random_uuid(),
  bid_request_id uuid references bid_requests(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  header text,
  vendor_name text,
  vendor_contact text,
  vendor_email text,
  due_date date,
  quoted_amount numeric(12,2),
  content text,
  status text default 'draft' check (status in ('draft','sent','received')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RFIs - Updated to reference companies
create table if not exists rfis (
  id uuid primary key default gen_random_uuid(),
  bid_request_id uuid references bid_requests(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  header text,
  sent_to_name text,
  sent_to_contact text,
  sent_to_email text,
  question text,
  response text,
  status text default 'open' check (status in ('open','answered','closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table bid_requests enable row level security;
alter table proposals enable row level security;
alter table companies enable row level security;
alter table rfqs enable row level security;
alter table rfis enable row level security;

-- Policies (users only see their own data)
create policy if not exists "own bids" on bid_requests for all using (auth.uid() = user_id);
create policy if not exists "own proposals" on proposals for all using (auth.uid() = user_id);
create policy if not exists "own companies" on companies for all using (auth.uid() = user_id);
create policy if not exists "own rfqs" on rfqs for all using (auth.uid() = user_id);
create policy if not exists "own rfis" on rfis for all using (auth.uid() = user_id);
