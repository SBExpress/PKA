-- Run this in your Supabase SQL editor to set up multi-tenancy
-- Version 9: Convert from single-tenant to multi-tenant organization model

-- ============================================================================
-- PART 1: CREATE NEW TABLES FOR ORGANIZATIONS & ROLES
-- ============================================================================

-- Organizations table (one per company using SubFlow)
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User to Organization mapping with roles
create table if not exists user_organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member', 'readonly')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, organization_id)
);

-- Audit log for bulk imports
create table if not exists bulk_import_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  import_type text not null check (import_type in ('customers', 'contacts')),
  total_rows int not null,
  successful_rows int not null,
  failed_rows int not null,
  errors jsonb,
  imported_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- ============================================================================
-- PART 2: ADD ORGANIZATION_ID TO ALL EXISTING DATA TABLES
-- ============================================================================

-- Add organization_id to bid_requests
alter table bid_requests add column if not exists organization_id uuid references organizations(id) on delete cascade;
create index if not exists idx_bid_requests_organization_id on bid_requests(organization_id);

-- Add organization_id to proposals
alter table proposals add column if not exists organization_id uuid references organizations(id) on delete cascade;
create index if not exists idx_proposals_organization_id on proposals(organization_id);

-- Add organization_id to companies
alter table companies add column if not exists organization_id uuid references organizations(id) on delete cascade;
create index if not exists idx_companies_organization_id on companies(organization_id);

-- Add organization_id to contacts
alter table contacts add column if not exists organization_id uuid references organizations(id) on delete cascade;
create index if not exists idx_contacts_organization_id on contacts(organization_id);

-- Add organization_id to rfqs
alter table rfqs add column if not exists organization_id uuid references organizations(id) on delete cascade;
create index if not exists idx_rfqs_organization_id on rfqs(organization_id);

-- Add organization_id to rfis
alter table rfis add column if not exists organization_id uuid references organizations(id) on delete cascade;
create index if not exists idx_rfis_organization_id on rfis(organization_id);

-- Add organization_id to settings (if table exists)
alter table if exists settings add column if not exists organization_id uuid references organizations(id) on delete cascade;
create index if not exists idx_settings_organization_id on settings(organization_id);

-- ============================================================================
-- PART 3: ENABLE ROW LEVEL SECURITY ON NEW TABLES
-- ============================================================================

alter table organizations enable row level security;
alter table user_organizations enable row level security;
alter table bulk_import_logs enable row level security;

-- RLS Policy for organizations (users can see orgs they belong to)
drop policy if exists "users_can_see_own_organizations" on organizations;
create policy "users_can_see_own_organizations" on organizations for select using (
  id in (select organization_id from user_organizations where user_id = auth.uid())
);

-- RLS Policy for user_organizations (users can see their own memberships, admins can manage)
drop policy if exists "users_can_see_own_memberships" on user_organizations;
create policy "users_can_see_own_memberships" on user_organizations for select using (
  user_id = auth.uid() or
  organization_id in (
    select organization_id from user_organizations
    where user_id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "admins_can_manage_memberships" on user_organizations;
create policy "admins_can_manage_memberships" on user_organizations for all using (
  organization_id in (
    select organization_id from user_organizations
    where user_id = auth.uid() and role = 'admin'
  )
) with check (
  organization_id in (
    select organization_id from user_organizations
    where user_id = auth.uid() and role = 'admin'
  )
);

-- RLS Policy for bulk_import_logs
drop policy if exists "org_members_can_view_import_logs" on bulk_import_logs;
create policy "org_members_can_view_import_logs" on bulk_import_logs for select using (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);

-- ============================================================================
-- PART 4: UPDATE RLS POLICIES FOR ALL DATA TABLES
-- ============================================================================

-- BID_REQUESTS: Replace old user_id policy with organization-based policy
drop policy if exists "own bids" on bid_requests;
create policy "org_members_can_view_bids" on bid_requests for select using (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_members_can_insert_bids" on bid_requests for insert with check (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_members_can_update_bids" on bid_requests for update using (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
) with check (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_admins_can_delete_bids" on bid_requests for delete using (
  organization_id in (
    select organization_id from user_organizations
    where user_id = auth.uid() and role = 'admin'
  )
);

-- PROPOSALS: Replace old user_id policy with organization-based policy
drop policy if exists "own proposals" on proposals;
create policy "org_members_can_view_proposals" on proposals for select using (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_members_can_insert_proposals" on proposals for insert with check (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_members_can_update_proposals" on proposals for update using (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
) with check (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_admins_can_delete_proposals" on proposals for delete using (
  organization_id in (
    select organization_id from user_organizations
    where user_id = auth.uid() and role = 'admin'
  )
);

-- COMPANIES: Replace old user_id policy with organization-based policy
drop policy if exists "own companies" on companies;
create policy "org_members_can_view_companies" on companies for select using (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_members_can_insert_companies" on companies for insert with check (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_members_can_update_companies" on companies for update using (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
) with check (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_admins_can_delete_companies" on companies for delete using (
  organization_id in (
    select organization_id from user_organizations
    where user_id = auth.uid() and role = 'admin'
  )
);

-- CONTACTS: Replace old user_id policy with organization-based policy
drop policy if exists "own contacts" on contacts;
create policy "org_members_can_view_contacts" on contacts for select using (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_members_can_insert_contacts" on contacts for insert with check (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_members_can_update_contacts" on contacts for update using (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
) with check (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_admins_can_delete_contacts" on contacts for delete using (
  organization_id in (
    select organization_id from user_organizations
    where user_id = auth.uid() and role = 'admin'
  )
);

-- RFQS: Replace old user_id policy with organization-based policy
drop policy if exists "own rfqs" on rfqs;
create policy "org_members_can_view_rfqs" on rfqs for select using (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_members_can_insert_rfqs" on rfqs for insert with check (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_members_can_update_rfqs" on rfqs for update using (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
) with check (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_admins_can_delete_rfqs" on rfqs for delete using (
  organization_id in (
    select organization_id from user_organizations
    where user_id = auth.uid() and role = 'admin'
  )
);

-- RFIS: Replace old user_id policy with organization-based policy
drop policy if exists "own rfis" on rfis;
create policy "org_members_can_view_rfis" on rfis for select using (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_members_can_insert_rfis" on rfis for insert with check (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_members_can_update_rfis" on rfis for update using (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
) with check (
  organization_id in (
    select organization_id from user_organizations where user_id = auth.uid()
  )
);
create policy "org_admins_can_delete_rfis" on rfis for delete using (
  organization_id in (
    select organization_id from user_organizations
    where user_id = auth.uid() and role = 'admin'
  )
);

-- ============================================================================
-- PART 5: MIGRATION - CREATE EXPRESS ELECTRIC ORG AND MIGRATE EXISTING DATA
-- ============================================================================

-- Step 1: Create the Express Electric, Inc. organization
insert into organizations (name)
values ('Express Electric, Inc.')
on conflict do nothing;

-- Step 2: Get the organization_id we just created
do $$
declare
  org_id uuid;
begin
  select id into org_id from organizations where name = 'Express Electric, Inc.' limit 1;

  -- Step 3: Add all existing users to the organization as admins
  insert into user_organizations (user_id, organization_id, role)
  select distinct user_id, org_id, 'admin'
  from bid_requests
  where user_id is not null
  on conflict (user_id, organization_id) do nothing;

  insert into user_organizations (user_id, organization_id, role)
  select distinct user_id, org_id, 'admin'
  from companies
  where user_id is not null and (user_id) not in (
    select user_id from user_organizations where organization_id = org_id
  )
  on conflict (user_id, organization_id) do nothing;

  insert into user_organizations (user_id, organization_id, role)
  select distinct user_id, org_id, 'admin'
  from contacts
  where user_id is not null and (user_id) not in (
    select user_id from user_organizations where organization_id = org_id
  )
  on conflict (user_id, organization_id) do nothing;

  insert into user_organizations (user_id, organization_id, role)
  select distinct user_id, org_id, 'admin'
  from proposals
  where user_id is not null and (user_id) not in (
    select user_id from user_organizations where organization_id = org_id
  )
  on conflict (user_id, organization_id) do nothing;

  -- Step 4: Update all existing data tables with organization_id
  update bid_requests set organization_id = org_id where organization_id is null;
  update proposals set organization_id = org_id where organization_id is null;
  update companies set organization_id = org_id where organization_id is null;
  update contacts set organization_id = org_id where organization_id is null;
  update rfqs set organization_id = org_id where organization_id is null;
  update rfis set organization_id = org_id where organization_id is null;
  update settings set organization_id = org_id where organization_id is null;

end $$;

-- ============================================================================
-- PART 6: ADD CONSTRAINTS TO REQUIRE ORGANIZATION_ID
-- ============================================================================

-- Make organization_id NOT NULL for all data tables
alter table bid_requests alter column organization_id set not null;
alter table proposals alter column organization_id set not null;
alter table companies alter column organization_id set not null;
alter table contacts alter column organization_id set not null;
alter table rfqs alter column organization_id set not null;
alter table rfis alter column organization_id set not null;
