-- Version 14: Add proposal_header column to proposals table

ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS proposal_header text;

-- Set default value for existing proposals (combine project_name and revision)
UPDATE proposals p
SET proposal_header = COALESCE(
  (SELECT br.project_name || ' - Rev ' || p.revision
   FROM bid_requests br
   WHERE br.id = p.bid_request_id),
  'Proposal - Rev ' || p.revision
)
WHERE proposal_header IS NULL;
