import { createServerSupabase } from '@/lib/supabaseServer'

// Validate a single customer row
function validateCustomer(row, rowNum) {
  const errors = []

  // Required: name
  if (!row.name || typeof row.name !== 'string' || !row.name.trim()) {
    errors.push('name is required')
  } else {
    row.name = row.name.trim()
  }

  // Type can be provided but defaults to 'customer'
  if (row.type && !['customer', 'vendor', 'both'].includes(row.type)) {
    errors.push("type must be 'customer', 'vendor', or 'both'")
  } else {
    row.type = row.type || 'customer'
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

  // Optional: address (trim whitespace)
  if (row.address && typeof row.address === 'string') {
    row.address = row.address.trim() || null
  } else {
    row.address = null
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
    row: errors.length === 0 ? row : null,
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
        { error: 'Only admins can bulk import customers' },
        { status: 403 }
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
      ...validateCustomer(row, idx + 2),
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
        ...r.row,
        organization_id,
        user_id: user.id,
      }))

    // Check for duplicates within the import
    const nameTypeSet = new Set()
    const duplicates = []
    validRows.forEach((row, idx) => {
      const key = `${row.name}|${row.type}`
      if (nameTypeSet.has(key)) {
        duplicates.push({
          row: validationResults.find(v => v.row === row)?.rowNum,
          errors: ['Duplicate: name and type already in this import'],
        })
      }
      nameTypeSet.add(key)
    })

    if (duplicates.length > 0) {
      errors.push(...duplicates)
    }

    // Filter out duplicates from validRows
    const uniqueRows = []
    const seenKeys = new Set()
    validRows.forEach(row => {
      const key = `${row.name}|${row.type}`
      if (!seenKeys.has(key)) {
        uniqueRows.push(row)
        seenKeys.add(key)
      }
    })

    // Check for duplicates in the database
    if (uniqueRows.length > 0) {
      const existingNames = uniqueRows.map(r => r.name)
      const { data: existing } = await supabase
        .from('companies')
        .select('name, type')
        .eq('organization_id', organization_id)
        .in('name', existingNames)

      existing?.forEach(ex => {
        uniqueRows.forEach((row, idx) => {
          if (row.name === ex.name && row.type === ex.type) {
            const originalRowNum = validationResults.find(
              v => v.row === row && v.valid
            )?.rowNum

            errors.push({
              row: originalRowNum,
              errors: [`Customer "${row.name}" (${row.type}) already exists`],
            })
          }
        })
      })
    }

    // Filter out existing duplicates
    const { data: existing } = await supabase
      .from('companies')
      .select('name, type')
      .eq('organization_id', organization_id)
      .in('name', uniqueRows.map(r => r.name))

    const existingSet = new Set(
      existing?.map(e => `${e.name}|${e.type}`) || []
    )

    const newRows = uniqueRows.filter(
      row => !existingSet.has(`${row.name}|${row.type}`)
    )

    let successful = []

    // Insert valid rows
    if (newRows.length > 0) {
      const { data, error: insertError } = await supabase
        .from('companies')
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
        import_type: 'customers',
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
