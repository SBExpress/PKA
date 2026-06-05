-- Version 12: Fix foreign key to reference companies instead of customers table

-- Drop the old constraint that references customers table
ALTER TABLE bid_requests DROP CONSTRAINT IF EXISTS bid_requests_customer_id_fkey;

-- Create new constraint referencing companies table
ALTER TABLE bid_requests
ADD CONSTRAINT bid_requests_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES companies(id) ON DELETE CASCADE;
