import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import { Plus, Building2 } from 'lucide-react'

const typeColors = {
  customer: 'bg-blue-100 text-blue-700',
  vendor: 'bg-purple-100 text-purple-700',
  both: 'bg-green-100 text-green-700',
}

export default async function CompaniesPage({ searchParams }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's organization
  const { data: membership } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/login')

  const filterType = searchParams?.type || 'all'

  let query = supabase
    .from('companies')
    .select('*')
    .eq('organization_id', membership.organization_id)

  if (filterType !== 'all') {
    query = query.in('type', filterType === 'both' ? ['both'] : [filterType, 'both'])
  }

  const { data: companies } = await query.order('name')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Companies</h1>
          <Link href="/companies/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} /> Add Company
          </Link>
        </div>

        {/* Type Filter */}
        <div className="mb-6 flex gap-2">
          <Link
            href="/companies"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </Link>
          <Link
            href="/companies?type=customer"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'customer'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Customers Only
          </Link>
          <Link
            href="/companies?type=vendor"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'vendor'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Vendors Only
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          {!companies?.length ? (
            <p className="px-6 py-12 text-slate-400 text-sm text-center">No companies found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-6 py-3 font-medium text-slate-500">Company Name</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Email</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Phone</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/companies/${c.id}`} className="font-medium text-slate-800 hover:text-blue-600 flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{c.email || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{c.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[c.type]}`}>
                        {c.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
