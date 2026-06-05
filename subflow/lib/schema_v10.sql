-- Version 10: Fix foreign key constraint to reference companies instead of customers

-- Drop the old foreign key constraint on bid_requests.customer_id
alter table bid_requests drop constraint if exists bid_requests_customer_id_fkey;

-- Add the corrected foreign key constraint referencing companies table
alter table bid_requests
add constraint bid_requests_customer_id_fkey
foreign key (customer_id) references companies(id) on delete cascade;

-- Do the same for contacts table if it has the wrong constraint
alter table contacts drop constraint if exists contacts_customer_id_fkey;
alter table contacts
add constraint contacts_company_id_fkey
foreign key (company_id) references companies(id) on delete cascade;
