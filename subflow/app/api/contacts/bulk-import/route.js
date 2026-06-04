import { createServerSupabase } from '@/lib/supabaseServer'

// Validate a single contact row
function validateContact(row, rowNum, companies) {
  const errors = []

  // Required: name
  if (!row.name || typeof row.name !== 'string' || !row.name.trim()) {
    errors.push('name is required')
  } else {
    row.name = row.name.trim()
  }

  // Required: company (can be company_name or company_id)
  let company_id = null

  if (row.company_id) {
    // If company_id provided, verify it exists
    const company = companies.find(c => c.id === row.company_id)
    if (!company) {
      errors.push(`company_id "${row.company_id}" does not exist`)
    } else {
      company_id = row.company_id
    }
  } else if (row.company_name) {
    // If company_name provided, lookup the ID
    const companyName = row.company_name.trim()
    const company = companies.find(
      c => c.name.toLowerCase() === companyName.toLowerCase()
    )
    if (!company) {
      errors.push(`company "${companyName}" not found`)
    } else {
      company_id = company.id
    }
  } else {
    errors.push('either company_id or company_name is required')
  }

  // Optional: email (validate format if provided)
  if (row.email && typeof row.email === 'string') {
    row.email = row.email.trim() || null
    if (row.email && !row.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push('email must be a valid email address')
    }
  } else {
    row.email = null
  }

  // Optional: phone (trim whitespace)
  if (row.phone && typeof row.phone === 'string') {
    row.phone = row.phone.trim() || null
  } else {
    row.phone = null
  }

  // Optional: title (trim whitespace)
  if (row.title && typeof row.title === 'string') {
    row.title = row.title.trim() || null
  } else {
    row.title = null
  }

  // Optional: notes (trim whitespace)
  if (row.notes && typeof row.notes === 'string') {
    row.notes = row.notes.trim() || null
  } else {
    row.notes = null
  }

  return {
    valid: errors.length === 0,
    errors,
    row:
      errors.length === 0
        ? {
            ...row,
            company_id,
          }
        : null,
  }
}

// Parse CSV string into array of objects
function parseCSV(csvData) {
  const lines = csvData.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row')
  }

  // Parse header
  const headerLine = lines[0]
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase())

  // Parse data rows
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines

    // Simple CSV parsing (handles basic cases, not quoted fields with commas)
    const values = line.split(',').map(v => v.trim())
    const row = {}

    headers.forEach((header, idx) => {
      row[header] = values[idx] || null
    })

    rows.push(row)
  }

  return rows
}

export async function POST(request) {
  try {
    // Authenticate user
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { organization_id, csv_data } = await request.json()

    if (!organization_id || !csv_data) {
      return Response.json(
        { error: 'Missing organization_id or csv_data' },
        { status: 400 }
      )
    }

    // Verify user is admin in this organization
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return Response.json(
        { error: 'Only admins can bulk import contacts' },
        { status: 403 }
      )
    }

    // Load all companies in this org for validation
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .eq('organization_id', organization_id)

    if (!companies || companies.length === 0) {
      return Response.json(
        { error: 'No companies found in this organization. Add companies before importing contacts.' },
        { status: 400 }
      )
    }

    // Parse CSV
    let rows
    try {
      rows = parseCSV(csv_data)
    } catch (err) {
      return Response.json(
        { error: `CSV parsing error: ${err.message}` },
        { status: 400 }
      )
    }

    if (rows.length === 0) {
      return Response.json(
        { error: 'No data rows found in CSV' },
        { status: 400 }
      )
    }

    // Validate all rows
    const validationResults = rows.map((row, idx) => ({
      rowNum: idx + 2, // +2 because row 1 is header
      ...validateContact(row, idx + 2, companies),
    }))

    const errors = validationResults
      .filter(r => !r.valid)
      .map(r => ({
        row: r.rowNum,
        errors: r.errors,
      }))

    const validRows = validationResults
      .filter(r => r.valid)
      .map(r => ({
        name: r.row.name,
        email: r.row.email,
        phone: r.row.phone,
        title: r.row.title,
        notes: r.row.notes,
        company_id: r.row.company_id,
        organization_id,
        user_id: user.id,
      }))

    // Check for duplicates within the import (same name + company)
    const nameCompanySet = new Set()
    const duplicates = []
    validRows.forEach((row, idx) => {
      const key = `${row.name}|${row.company_id}`
      if (nameCompanySet.has(key)) {
        const originalRowNum = validationResults.find(
          v => v.row === row && v.valid
        )?.rowNum
        duplicates.push({
          row: originalRowNum,
          errors: ['Duplicate: contact name and company already in this import'],
        })
      }
      nameCompanySet.add(key)
    })

    if (duplicates.length > 0) {
      errors.push(...duplicates)
    }

    // Filter out duplicates from validRows
    const uniqueRows = []
    const seenKeys = new Set()
    validRows.forEach(row => {
      const key = `${row.name}|${row.company_id}`
      if (!seenKeys.has(key)) {
        uniqueRows.push(row)
        seenKeys.add(key)
      }
    })

    // Check for duplicates in the database (same name + company_id)
    if (uniqueRows.length > 0) {
      const companyIds = uniqueRows.map(r => r.company_id)
      const { data: existing } = await supabase
        .from('contacts')
        .select('name, company_id')
        .eq('organization_id', organization_id)
        .in('company_id', companyIds)

      existing?.forEach(ex => {
        uniqueRows.forEach((row, idx) => {
          if (row.name === ex.name && row.company_id === ex.company_id) {
            const originalRowNum = validationResults.find(
              v => v.row === row && v.valid
            )?.rowNum

            const companyName = companies.find(c => c.id === ex.company_id)?.name
            errors.push({
              row: originalRowNum,
              errors: [
                `Contact "${row.name}" at "${companyName}" already exists`,
              ],
            })
          }
        })
      })
    }

    // Filter out existing duplicates
    const { data: existing } = await supabase
      .from('contacts')
      .select('name, company_id')
      .eq('organization_id', organization_id)
      .in('company_id', uniqueRows.map(r => r.company_id))

    const existingSet = new Set(
      existing?.map(e => `${e.name}|${e.company_id}`) || []
    )

    const newRows = uniqueRows.filter(
      row => !existingSet.has(`${row.name}|${row.company_id}`)
    )

    let successful = []

    // Insert valid rows
    if (newRows.length > 0) {
      const { data, error: insertError } = await supabase
        .from('contacts')
        .insert(newRows)
        .select()

      if (insertError) {
        return Response.json(
          {
            total: rows.length,
            successful: 0,
            failed: rows.length,
            errors: [{ message: `Database error: ${insertError.message}` }],
          },
          { status: 500 }
        )
      }

      successful = data || []
    }

    // Log the import
    await supabase
      .from('bulk_import_logs')
      .insert({
        organization_id,
        import_type: 'contacts',
        total_rows: rows.length,
        successful_rows: successful.length,
        failed_rows: errors.length,
        errors: errors.length > 0 ? errors : null,
        imported_by: user.id,
      })

    return Response.json({
      total: rows.length,
      successful: successful.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : [],
    })
  } catch (err) {
    console.error('Bulk import error:', err)
    return Response.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}
