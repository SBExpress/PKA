-- Run this in your Supabase SQL editor to add the new tables

-- Customers (GC companies)
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_name text not null,
  address text,
  address2 text,
  city text,
  state text,
  zip text,
  phone text,
  email text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contacts (individuals at a customer company)
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  first_name text,
  last_name text,
  title text,
  email text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Proposal templates
create table if not exists proposal_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  section text not null,
  name text not null,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table customers enable row level security;
alter table contacts enable row level security;
alter table proposal_templates enable row level security;

-- Policies
create policy "own customers" on customers for all using (auth.uid() = user_id);
create policy "own contacts" on contacts for all using (auth.uid() = user_id);
create policy "own templates" on proposal_templates for all using (auth.uid() = user_id);

-- Update bid_requests to use split address fields and link to customer/contact
alter table bid_requests add column if not exists address text;
alter table bid_requests add column if not exists address2 text;
alter table bid_requests add column if not exists city text;
alter table bid_requests add column if not exists state text;
alter table bid_requests add column if not exists zip text;
alter table bid_requests add column if not exists customer_id uuid references customers(id);
alter table bid_requests add column if not exists contact_id uuid references contacts(id);

-- Update proposals to store rich text as HTML and link to contact
alter table proposals add column if not exists contact_id uuid references contacts(id);
alter table proposals drop column if exists cover_letter;
