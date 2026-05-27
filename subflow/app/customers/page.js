import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import { Plus, Building2 } from 'lucide-react'

export default async function CustomersPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customers } = await supabase
    .from('companies')
    .select('*')
    .in('type', ['customer', 'both'])
    .eq('user_id', user.id)
    .order('name')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <Link href="/customers/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} /> Add Customer
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm">
          {!customers?.length ? (
            <p className="px-6 py-12 text-slate-400 text-sm text-center">No customers yet.</p>
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
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/customers/${c.id}`} className="font-medium text-slate-800 hover:text-blue-600 flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{c.email || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{c.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
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
