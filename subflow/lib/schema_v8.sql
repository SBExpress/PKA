-- Run this in your Supabase SQL editor to set up the database
-- Version 8: Performance optimization - add indexes for faster queries

-- Indexes for bid_requests table
create index if not exists idx_bid_requests_user_id on bid_requests(user_id);
create index if not exists idx_bid_requests_user_created on bid_requests(user_id, created_at desc);
create index if not exists idx_bid_requests_user_status on bid_requests(user_id, status);
create index if not exists idx_bid_requests_user_due_date on bid_requests(user_id, bid_due_date);
create index if not exists idx_bid_requests_status on bid_requests(status);
create index if not exists idx_bid_requests_due_date on bid_requests(bid_due_date);
create index if not exists idx_bid_requests_company_id on bid_requests(company_id);

-- Indexes for proposals table
create index if not exists idx_proposals_user_id on proposals(user_id);
create index if not exists idx_proposals_bid_request_id on proposals(bid_request_id);
create index if not exists idx_proposals_status on proposals(status);

-- Indexes for companies table
create index if not exists idx_companies_user_id on companies(user_id);
create index if not exists idx_companies_user_type on companies(user_id, type);
create index if not exists idx_companies_type on companies(type);

-- Indexes for contacts table
create index if not exists idx_contacts_user_id on contacts(user_id);
create index if not exists idx_contacts_company_id on contacts(company_id);
create index if not exists idx_contacts_user_company on contacts(user_id, company_id);

-- Indexes for RFQs table
create index if not exists idx_rfqs_user_id on rfqs(user_id);
create index if not exists idx_rfqs_bid_request_id on rfqs(bid_request_id);
create index if not exists idx_rfqs_company_id on rfqs(company_id);
create index if not exists idx_rfqs_status on rfqs(status);

-- Indexes for RFIs table
create index if not exists idx_rfis_user_id on rfis(user_id);
create index if not exists idx_rfis_bid_request_id on rfis(bid_request_id);
create index if not exists idx_rfis_company_id on rfis(company_id);
create index if not exists idx_rfis_status on rfis(status);
