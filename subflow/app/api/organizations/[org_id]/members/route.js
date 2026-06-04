import { createServerSupabase } from '@/lib/supabaseServer'

export async function GET(request, { params }) {
  try {
    const { org_id } = params

    // Authenticate user
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user belongs to this org (any role can see members)
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', org_id)
      .single()

    if (!membership) {
      return Response.json(
        { error: 'You do not belong to this organization' },
        { status: 403 }
      )
    }

    // Get all members of the organization
    const { data: members, error } = await supabase
      .from('user_organizations')
      .select(`
        id,
        user_id,
        role,
        created_at,
        organization_id
      `)
      .eq('organization_id', org_id)

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // For each member, get their email from auth.users (via Supabase)
    // Note: We can't directly query auth.users from client code, but we can try
    // to get basic profile info if stored elsewhere. For now, return member data.
    // The email should be fetched client-side or stored in a profiles table.

    return Response.json({
      members,
    })
  } catch (err) {
    console.error('Get members error:', err)
    return Response.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const { org_id } = params

    // Authenticate user
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is admin in this org
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', org_id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return Response.json(
        { error: 'Only admins can manage organization members' },
        { status: 403 }
      )
    }

    const { user_email, role } = await request.json()

    if (!user_email || !role) {
      return Response.json(
        { error: 'Missing user_email or role' },
        { status: 400 }
      )
    }

    if (!['admin', 'member', 'readonly'].includes(role)) {
      return Response.json(
        { error: "Role must be 'admin', 'member', or 'readonly'" },
        { status: 400 }
      )
    }

    // Look up user by email in Supabase Auth
    // Note: We need to use admin API. For now, this is a limitation.
    // We'll try to get the user_id from existing data, or return an error.

    // As a workaround, we can store user emails in a profiles table
    // For now, return an error explaining the limitation
    return Response.json(
      {
        error: 'User lookup by email requires admin API. Store user profiles in a profiles table with email.'
      },
      { status: 501 }
    )

  } catch (err) {
    console.error('Add member error:', err)
    return Response.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { org_id } = params

    // Authenticate user
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is admin in this org
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', org_id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return Response.json(
        { error: 'Only admins can manage organization members' },
        { status: 403 }
      )
    }

    const { user_id } = await request.json()

    if (!user_id) {
      return Response.json(
        { error: 'Missing user_id' },
        { status: 400 }
      )
    }

    // Prevent removing yourself
    if (user_id === user.id) {
      return Response.json(
        { error: 'You cannot remove yourself from the organization' },
        { status: 400 }
      )
    }

    // Delete the membership
    const { error } = await supabase
      .from('user_organizations')
      .delete()
      .eq('user_id', user_id)
      .eq('organization_id', org_id)

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return Response.json({
      message: 'Member removed successfully',
    })
  } catch (err) {
    console.error('Remove member error:', err)
    return Response.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    const { org_id } = params

    // Authenticate user
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is admin in this org
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', org_id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return Response.json(
        { error: 'Only admins can manage organization members' },
        { status: 403 }
      )
    }

    const { user_id, role } = await request.json()

    if (!user_id || !role) {
      return Response.json(
        { error: 'Missing user_id or role' },
        { status: 400 }
      )
    }

    if (!['admin', 'member', 'readonly'].includes(role)) {
      return Response.json(
        { error: "Role must be 'admin', 'member', or 'readonly'" },
        { status: 400 }
      )
    }

    // Update the role
    const { data, error } = await supabase
      .from('user_organizations')
      .update({ role })
      .eq('user_id', user_id)
      .eq('organization_id', org_id)
      .select()
      .single()

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return Response.json({
      message: 'Member role updated successfully',
      member: data,
    })
  } catch (err) {
    console.error('Update member role error:', err)
    return Response.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    )
  }
}
