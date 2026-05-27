-- Run this in your Supabase SQL editor

-- Add description field to proposals (new section above drawings)
alter table proposals add column if not exists description text;

-- Add cell phone to contacts
alter table contacts add column if not exists cell_phone text;

-- Add license number and website to customers
alter table customers add column if not exists website text;
alter table customers add column if not exists notes text;

-- Add license / trade to contacts
alter table contacts add column if not exists notes text;
