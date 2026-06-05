import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import { Users, Upload, LogOut } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify user is admin
  const { data: membership, error } = await supabase
    .from('user_organizations')
    .select('role, organizations(name)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (error || !membership || membership.role !== 'admin') {
    redirect('/dashboard')
  }

  const org = membership.organizations

  // Get recent import logs
  const { data: logs } = await supabase
    .from('bulk_import_logs')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-100">
        <div className="max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Administration
            </h1>
            <p className="text-slate-600">
              Manage organization members and import data
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link
              href="/admin/members"
              className="block p-6 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-blue-600" size={24} />
                <h2 className="text-lg font-semibold text-slate-800">
                  Manage Members
                </h2>
              </div>
              <p className="text-sm text-slate-600">
                Add users, assign roles, and manage team access
              </p>
            </Link>

            <Link
              href="/admin/bulk-import"
              className="block p-6 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <Upload className="text-green-600" size={24} />
                <h2 className="text-lg font-semibold text-slate-800">
                  Bulk Import
                </h2>
              </div>
              <p className="text-sm text-slate-600">
                Import customers and contacts from CSV files
              </p>
            </Link>
          </div>

          {/* Organization Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-slate-800 mb-2">
              Organization
            </h3>
            <p className="text-slate-700">{org.name}</p>
          </div>

          {/* Recent Imports */}
          {logs && logs.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Recent Imports</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {logs.map(log => (
                  <div key={log.id} className="p-4 hover:bg-slate-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-800 capitalize">
                          {log.import_type}
                        </p>
                        <p className="text-sm text-slate-600">
                          {log.successful_rows} successful, {log.failed_rows}{' '}
                          failed
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(log.created_at).toLocaleDateString()}{' '}
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
