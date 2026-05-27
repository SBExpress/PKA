# SubFlow

All-in-one estimating and project management for subcontractors.

## Setup

### 1. Create a Supabase project
Go to supabase.com, create a free account and a new project.

### 2. Set up the database
In your Supabase dashboard, go to the SQL Editor and run the contents of `lib/schema.sql`.

### 3. Configure environment variables
Copy `.env.local.example` to `.env.local` and fill in your Supabase URL and anon key (found in your Supabase project settings under API).

### 4. Create your account
In Supabase, go to Authentication > Users > Add User. Create your login email and password.

### 5. Install and run
```
npm install
npm run dev
```

Open http://localhost:3000 and sign in.

## Deploy to Vercel
1. Push this folder to a GitHub repo
2. Connect the repo to Vercel at vercel.com
3. Add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY as environment variables in Vercel
4. Deploy

## Phase 1 Features
- Bid request management (add, edit, view, status tracking)
- Dashboard with status counts
- Proposal builder (cover letter, drawings, scope, clarifications, exclusions, price breakdown, alternates, terms)
- PDF generation with project header on every page and signature page
- RFQ and RFI (coming in next sprint)
