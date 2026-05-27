import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import { Plus, AlertCircle } from 'lucide-react'

const statusColor = {
  received: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-purple-100 text-purple-700',
  declined: 'bg-slate-100 text-slate-600',
  awarded: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr + 'T00:00:00') - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function Dashboard() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bids } = await supabase
    .from('bid_requests')
    .select('*, proposals(id, revision, status, total_price, date)')
    .eq('user_id', user.id)
    .order('bid_due_date', { ascending: true, nullsFirst: false })
    .limit(10)

  // Efficiently count bids by status using a single optimized query
  const { data: statusCounts } = await supabase
    .from('bid_requests')
    .select('status', { count: 'exact', head: false })
    .eq('user_id', user.id)

  const counts = { received: 0, in_progress: 0, submitted: 0, awarded: 0, lost: 0, declined: 0 }
  statusCounts?.forEach(b => { if (counts[b.status] !== undefined) counts[b.status]++ })

  const activeBids = bids?.filter(b => !['declined', 'awarded', 'lost'].includes(b.status)) || []
  const urgentBids = activeBids.filter(b => { const d = daysUntil(b.bid_due_date); return d !== null && d <= 7 })

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <Link href="/bids/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={15} /> New Bid Request
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Received', key: 'received', color: 'border-blue-500' },
            { label: 'In Progress', key: 'in_progress', color: 'border-yellow-500' },
            { label: 'Submitted', key: 'submitted', color: 'border-purple-500' },
            { label: 'Awarded', key: 'awarded', color: 'border-green-500' },
            { label: 'Lost', key: 'lost', color: 'border-red-400' },
          ].map(({ label, key, color }) => (
            <Link key={key} href={`/bids?status=${key}`} className={`bg-white rounded-xl p-4 border-l-4 ${color} shadow-sm hover:shadow-md transition-shadow`}>
              <p className="text-2xl font-bold text-slate-800">{counts[key]}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </Link>
          ))}
        </div>

        {urgentBids.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={15} className="text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">Bids Due Soon</p>
            </div>
            <ul className="space-y-1">
              {urgentBids.map(b => {
                const days = daysUntil(b.bid_due_date)
                return (
                  <li key={b.id}>
                    <Link href={`/bids/${b.id}`} className="flex items-center justify-between text-sm hover:underline">
                      <span className="text-amber-900 font-medium">{b.project_name}</span>
                      <span className={`text-xs font-medium ${days <= 2 ? 'text-red-600' : 'text-amber-700'}`}>
                        {days === 0 ? 'Due today' : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Active Bid Requests</h2>
            <Link href="/bids" className="text-blue-600 hover:underline text-sm">View all</Link>
          </div>
          {!activeBids.length ? (
            <p className="px-6 py-8 text-slate-400 text-sm text-center">No active bid requests.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-6 py-3 font-medium text-slate-500">Project</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Customer</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Bid Due</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Proposal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeBids.map(bid => {
                  const days = daysUntil(bid.bid_due_date)
                  const urgent = days !== null && days <= 3
                  const latestProposal = bid.proposals?.length
                    ? [...bid.proposals].sort((a, b) => b.revision - a.revision)[0]
                    : null
                  const propStatusColor = {
                    draft: 'bg-slate-100 text-slate-500',
                    sent: 'bg-blue-100 text-blue-600',
                    signed: 'bg-green-100 text-green-700',
                    declined: 'bg-red-100 text-red-600',
                  }
                  return (
                    <tr key={bid.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <Link href={`/bids/${bid.id}`} className="font-medium text-slate-800 hover:text-blue-600">{bid.project_name}</Link>
                        {(bid.city || bid.state) && <p className="text-xs text-slate-400 mt-0.5">{[bid.city, bid.state].filter(Boolean).join(', ')}</p>}
                      </td>
                      <td className="px-6 py-3 text-slate-600">{bid.customer_company || bid.customer_name || ''}</td>
                      <td className="px-6 py-3">
                        {bid.bid_due_date ? (
                          <span className={urgent ? 'text-red-600 font-medium' : 'text-slate-600'}>
                            {formatDate(bid.bid_due_date)}
                            {days !== null && <span className="text-xs ml-1 text-slate-400">({days === 0 ? 'today' : days < 0 ? `${Math.abs(days)}d ago` : `${days}d`})</span>}
                          </span>
                        ) : <span className="text-slate-400">TBD</span>}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[bid.status]}`}>
                          {bid.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {latestProposal ? (
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${propStatusColor[latestProposal.status] || 'bg-slate-100 text-slate-500'}`}>
                              {latestProposal.status} · Rev {latestProposal.revision}
                            </span>
                            {latestProposal.total_price && (
                              <span className="text-xs text-slate-600 font-medium">
                                ${Number(latestProposal.total_price).toLocaleString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
