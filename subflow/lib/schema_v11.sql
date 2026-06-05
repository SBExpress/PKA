-- Version 11: Add missing contact fields (cellphone, address)

alter table contacts add column if not exists cellphone text;
alter table contacts add column if not exists address text;

-- Update contacts table schema cache
select pg_sleep(0.1);
