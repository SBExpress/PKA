'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useOrganization } from '@/lib/useOrganization'
import { Shield, User, Eye, Trash2, Check, X } from 'lucide-react'

export default function MembersPage() {
  const router = useRouter()
  const { org, isAdmin, loading: orgLoading, error: orgError } = useOrganization()
  const supabase = createClient()

  const [members, setMembers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState('member')
  const [addingUser, setAddingUser] = useState(false)

  // Redirect if not admin
  useEffect(() => {
    if (!orgLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [orgLoading, isAdmin, router])

  // Load current user
  useEffect(() => {
    async function loadCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    loadCurrentUser()
  }, [supabase])

  // Load members
  useEffect(() => {
    async function loadMembers() {
      if (!org) return

      try {
        const response = await fetch(
          `/api/organizations/${org.id}/members`,
          {
            method: 'GET',
          }
        )

        if (!response.ok) {
          throw new Error('Failed to load members')
        }

        const data = await response.json()
        setMembers(data.members || [])
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadMembers()
  }, [org])

  // Update member role
  async function updateMemberRole(userId, newRole) {
    if (!org) return

    setUpdating(userId)
    try {
      const response = await fetch(
        `/api/organizations/${org.id}/members`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, role: newRole }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update role')
      }

      // Update local state
      setMembers(members.map(m =>
        m.user_id === userId ? { ...m, role: newRole } : m
      ))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating(null)
    }
  }

  // Remove member
  async function removeMember(userId) {
    if (!org) return
    if (!confirm('Are you sure you want to remove this member?')) return

    setUpdating(userId)
    try {
      const response = await fetch(
        `/api/organizations/${org.id}/members`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove member')
      }

      setMembers(members.filter(m => m.user_id !== userId))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating(null)
    }
  }

  // Add new member (placeholder - requires user lookup)
  async function addNewMember(e) {
    e.preventDefault()
    setError('User invitation feature not yet implemented. Please manually create a user account in Supabase Auth, then their role can be managed here.')
  }

  if (orgLoading || loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-center py-12">
            <p className="text-slate-600">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  if (orgError) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error: {orgError}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">
            Manage Members
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Add Member Form */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h2 className="font-semibold text-slate-800 mb-4">
              Add Member
            </h2>
            <form onSubmit={addNewMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  disabled={addingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  disabled={addingUser}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="readonly">Read-only</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={addingUser || !newUserEmail}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {addingUser ? 'Adding...' : 'Add Member'}
              </button>
            </form>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">
                Team Members ({members.length})
              </h2>
            </div>

            {members.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No members yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3 text-left font-medium text-slate-700">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-slate-700">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-slate-700">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map(member => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {member.role === 'admin' && (
                            <Shield size={14} className="text-blue-600" />
                          )}
                          {member.role === 'member' && (
                            <User size={14} className="text-slate-400" />
                          )}
                          {member.role === 'readonly' && (
                            <Eye size={14} className="text-slate-400" />
                          )}
                          <span className="font-mono text-xs text-slate-600 truncate">
                            {member.user_id}
                          </span>
                        </div>
                        {currentUser?.id === member.user_id && (
                          <span className="text-xs text-slate-500">(you)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={member.role}
                          onChange={e =>
                            updateMemberRole(member.user_id, e.target.value)
                          }
                          disabled={
                            updating === member.user_id ||
                            currentUser?.id === member.user_id
                          }
                          className="border border-slate-200 rounded px-2 py-1 text-xs"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="readonly">Read-only</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => removeMember(member.user_id)}
                          disabled={
                            updating === member.user_id ||
                            currentUser?.id === member.user_id
                          }
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              To add a new member:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Create a user account in Supabase Auth</li>
              <li>User logs in to SubFlow</li>
              <li>They will appear in this list automatically</li>
              <li>Assign them an appropriate role (Admin, Member, Read-only)</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
