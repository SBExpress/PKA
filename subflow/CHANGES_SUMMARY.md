# SubFlow Updates Summary

## Changes Made

### 1. **Removed "Both" from Companies Page Filter** ✅
- **File**: `app/companies/page.js`
- Removed the "Both" filter button from the Companies page
- The "both" type still works in company details — companies with type "both" are included in "All" view and in their respective detail pages

### 2. **Added Address Field with Google Maps Integration** ✅
- **Files**:
  - `components/GoogleAddressInput.js` (NEW) — Autocomplete component using Google Maps Places API
  - `components/forms/CompanyForm.js` — Updated to include address field
  - `lib/schema_v7.sql` (NEW) — Schema migration adding address fields to companies table
  
- **Features**:
  - Address field with Google Maps Places autocomplete
  - Stores formatted address, latitude, and longitude
  - Component automatically loads Google Maps script

### 3. **Added Multiple Contacts Per Company** ✅
- **Files**:
  - `components/forms/CompanyForm.js` — Updated with contact management UI
  - `app/companies/[id]/page.js` — Updated to fetch contacts
  - `lib/schema_v7.sql` — New contacts table schema

- **Features**:
  - Create multiple contacts per company
  - Each contact has: name, email, phone, title
  - View, edit, and delete contacts directly in company form
  - Contact list shown only when editing existing company

## Setup Required

### 1. **Run Database Migration**
Execute the following in your Supabase SQL editor:
```bash
# Copy contents of lib/schema_v7.sql and run in Supabase
```

### 2. **Add Google Maps API Key**
Update your `.env.local` file:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

To get a Google Maps API key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Maps JavaScript API" and "Places API"
4. Create an API key (Restricted to browser applications, referrer URLs)
5. Add the key to `.env.local`

## Testing Checklist

- [ ] Run schema migration (schema_v7.sql)
- [ ] Add Google Maps API key to .env.local
- [ ] Test Companies page — verify "Both" filter is removed
- [ ] Create a new company with address using Google Maps autocomplete
- [ ] Add multiple contacts to a company
- [ ] Edit company and verify contacts persist
- [ ] Delete a contact and verify it removes correctly

## Files Modified/Created
- ✅ `lib/schema_v7.sql` (NEW)
- ✅ `components/GoogleAddressInput.js` (NEW)
- ✅ `components/forms/CompanyForm.js` (UPDATED)
- ✅ `app/companies/page.js` (UPDATED)
- ✅ `app/companies/[id]/page.js` (UPDATED)
