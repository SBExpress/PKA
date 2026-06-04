'use client'

import { useEffect, useState } from 'react'
import { createClient } from './supabase'

export function useOrganization() {
  const [org, setOrg] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadOrganization() {
      try {
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        // Get user's organization (first org they belong to)
        const { data: membership, error: membershipError } = await supabase
          .from('user_organizations')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (membershipError && membershipError.code !== 'PGRST116') {
          // PGRST116 = no rows found, which is expected for users not in an org yet
          console.error('Membership error:', membershipError)
          setError(membershipError.message)
          setLoading(false)
          return
        }

        if (membership) {
          // Now fetch the organization details
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', membership.organization_id)
            .single()

          if (orgError) {
            console.error('Org fetch error:', orgError)
            setError(orgError.message)
            setLoading(false)
            return
          }

          setOrg(orgData)
          setRole(membership.role)
        } else {
          console.warn('User does not belong to any organization')
          setError('User does not belong to any organization')
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading organization:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    loadOrganization()
  }, [])

  return {
    org,
    role,
    loading,
    error,
    isAdmin: role === 'admin',
    isMember: role === 'member',
    isReadonly: role === 'readonly',
  }
}
