import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import { Plus } from 'lucide-react'

const statusColor = {
  received: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-purple-100 text-purple-700',
  declined: 'bg-slate-100 text-slate-600',
  awarded: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
}

export default async function BidsPage() {
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

  const { data: bids } = await supabase
    .from('bid_requests')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Bid Requests</h1>
          <Link
            href="/bids/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            New Bid Request
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          {!bids?.length ? (
            <p className="px-6 py-12 text-slate-400 text-sm text-center">No bid requests yet. Add your first one.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-6 py-3 font-medium text-slate-500">Project</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Customer</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Due Date</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bids.map(bid => (
                  <tr key={bid.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/bids/${bid.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                        {bid.project_name}
                      </Link>
                      <p className="text-slate-400 text-xs mt-0.5">{bid.project_address}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{bid.customer_company || bid.customer_name}</td>
                    <td className="px-6 py-4 text-slate-600">{bid.bid_due_date || 'TBD'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[bid.status]}`}>
                        {bid.status.replace('_', ' ')}
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
