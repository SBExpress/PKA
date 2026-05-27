-- Run this in your Supabase SQL editor

-- Settings table (one row per user)
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  business_name text,
  business_address text,
  business_city text,
  business_state text,
  business_zip text,
  business_phone text,
  business_email text,
  primary_color text default '#1a2744',
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table settings enable row level security;
create policy "own settings" on settings for all using (auth.uid() = user_id);

-- Create storage bucket for logos (run separately if needed)
-- insert into storage.buckets (id, name, public) values ('logos', 'logos', true);
