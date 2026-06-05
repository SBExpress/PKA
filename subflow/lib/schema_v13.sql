-- Version 13: Add contact fields and organization_id to RFQs and RFIs

-- Add columns to rfqs table
ALTER TABLE rfqs
ADD COLUMN IF NOT EXISTS header text,
ADD COLUMN IF NOT EXISTS company_id uuid references companies(id) on delete set null,
ADD COLUMN IF NOT EXISTS vendor_name text,
ADD COLUMN IF NOT EXISTS vendor_contact_id uuid references contacts(id) on delete set null,
ADD COLUMN IF NOT EXISTS vendor_contact text,
ADD COLUMN IF NOT EXISTS vendor_email text,
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS quoted_amount numeric(12,2),
ADD COLUMN IF NOT EXISTS organization_id uuid references organizations(id) on delete cascade,
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- Add columns to rfis table
ALTER TABLE rfis
ADD COLUMN IF NOT EXISTS header text,
ADD COLUMN IF NOT EXISTS company_id uuid references companies(id) on delete set null,
ADD COLUMN IF NOT EXISTS sent_to_name text,
ADD COLUMN IF NOT EXISTS sent_to_contact_id uuid references contacts(id) on delete set null,
ADD COLUMN IF NOT EXISTS sent_to_contact text,
ADD COLUMN IF NOT EXISTS sent_to_email text,
ADD COLUMN IF NOT EXISTS organization_id uuid references organizations(id) on delete cascade,
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- Update RLS policies to include organization_id
DROP POLICY IF EXISTS "own rfqs" ON rfqs;
DROP POLICY IF EXISTS "own rfis" ON rfis;

CREATE POLICY "org rfqs" ON rfqs FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "org rfis" ON rfis FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  )
);
