import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import ProposalActions from '@/components/ProposalActions'
import RFQActions from '@/components/RFQActions'
import RFIActions from '@/components/RFIActions'
import { FileText, ArrowLeft, Edit, CopyPlus } from 'lucide-react'

const statusColor = {
  received: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-purple-100 text-purple-700',
  declined: 'bg-slate-100 text-slate-600',
  awarded: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  draft: 'bg-slate-100 text-slate-500',
  sent: 'bg-blue-100 text-blue-600',
  signed: 'bg-green-100 text-green-700',
  open: 'bg-yellow-100 text-yellow-700',
  answered: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-500',
}

export default async function BidDetailPage({ params }) {
  const { id } = await params
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

  const { data: bid } = await supabase
    .from('bid_requests')
    .select('*, companies:customer_id(name), contacts:contact_id(name, email, phone, cellphone)')
    .eq('id', id)
    .eq('organization_id', membership.organization_id)
    .single()
  if (!bid) notFound()

  const [{ data: proposals }, { data: rfqs }, { data: rfis }, { data: settings }] = await Promise.all([
    supabase.from('proposals').select('id, revision, status, total_price, date').eq('bid_request_id', bid.id).order('revision', { ascending: false }),
    supabase.from('rfqs').select('*').eq('bid_request_id', bid.id).order('created_at', { ascending: false }),
    supabase.from('rfis').select('*').eq('bid_request_id', bid.id).order('created_at', { ascending: false }),
    supabase.from('settings').select('*').eq('organization_id', membership.organization_id).single(),
  ])

  const address = bid.project_address || ''
  const customerName = bid.companies?.name || ''
  const contactName = bid.contacts?.name || ''
  const email = bid.contacts?.email || ''
  const phone = bid.contacts?.phone || ''
  const cellphone = bid.contacts?.cellphone || ''

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/bids" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 flex-1">{bid.project_name}</h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[bid.status] || 'bg-slate-100 text-slate-600'}`}>
            {bid.status?.replace('_', ' ')}
          </span>
          <Link href={`/bids/${bid.id}/edit`} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <Edit size={13} /> Edit
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 col-span-2">
            <h2 className="font-semibold text-slate-700 mb-4">Project Info</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {[
                ['Address', address],
                ['Company', customerName],
                ['Contact', contactName],
                ['Email', email],
                ['Phone', phone],
                ['Cell Phone', cellphone],
                ['Received', bid.received_date],
                ['Bid Due', bid.bid_due_date || 'TBD'],
              ].map(([k, v]) => v ? (
                <div key={k}>
                  <span className="text-slate-400">{k}: </span>
                  <span className="text-slate-700">{v}</span>
                </div>
              ) : null)}
            </div>
            {bid.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-slate-400 text-sm mb-1">Notes</p>
                <p className="text-slate-700 text-sm">{bid.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Link
              href={`/bids/${bid.id}/proposal`}
              className="flex items-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-3 rounded-xl transition-colors justify-center"
            >
              <FileText size={15} />
              New Proposal
            </Link>
            <Link
              href={`/bids/${bid.id}/rfq`}
              className="flex items-center gap-2 w-full bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-3 rounded-xl border border-slate-200 transition-colors justify-center"
            >
              New RFQ
            </Link>
            <Link
              href={`/bids/${bid.id}/rfi`}
              className="flex items-center gap-2 w-full bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-3 rounded-xl border border-slate-200 transition-colors justify-center"
            >
              New RFI
            </Link>
          </div>
        </div>

        {/* Proposals */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Proposals</h2>
            <Link href={`/bids/${bid.id}/proposal`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              + New
            </Link>
          </div>
          {!proposals?.length ? (
            <p className="px-6 py-5 text-sm text-slate-400">No proposals yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {proposals.map(p => (
                <li key={p.id} className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors gap-3">
                  <Link href={`/bids/${bid.id}/proposal?id=${p.id}`} className="flex-1 flex items-center gap-4 min-w-0">
                    <span className="text-sm font-medium text-slate-700">Revision {p.revision}</span>
                    {p.total_price && (
                      <span className="text-sm text-slate-600">${Number(p.total_price).toLocaleString()}</span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[p.status] || 'bg-slate-100 text-slate-600'}`}>
                      {p.status}
                    </span>
                  </Link>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <ProposalActions
                      proposal={{ id: p.id, revision: p.revision, status: p.status, total_price: p.total_price }}
                      bid={bid}
                      settings={settings}
                    />
                    <Link
                      href={`/bids/${bid.id}/proposal?from=${p.id}`}
                      className="text-slate-400 hover:text-green-600 transition-colors p-1.5 rounded hover:bg-green-50"
                      title="New Revision"
                    >
                      <CopyPlus size={15} />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* RFQs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">RFQs</h2>
            <Link href={`/bids/${bid.id}/rfq`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              + New
            </Link>
          </div>
          {!rfqs?.length ? (
            <p className="px-6 py-5 text-sm text-slate-400">No RFQs yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rfqs.map(r => (
                <li key={r.id} className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-slate-700">{r.header || 'No header'}</span>
                      {r.vendor_name && <span className="text-xs text-slate-500">{r.vendor_name}</span>}
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[r.status] || 'bg-slate-100 text-slate-500'}`}>
                        {r.status}
                      </span>
                    </div>
                    {r.quoted_amount && (
                      <span className="text-xs text-green-700 font-medium mt-0.5 block">
                        Quote: ${Number(r.quoted_amount).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <RFQActions rfq={r} bid={bid} settings={settings} />
                    <Link
                      href={`/bids/${bid.id}/rfq?id=${r.id}`}
                      className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded hover:bg-slate-100 text-xs font-medium ml-1"
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* RFIs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">RFIs</h2>
            <Link href={`/bids/${bid.id}/rfi`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              + New
            </Link>
          </div>
          {!rfis?.length ? (
            <p className="px-6 py-5 text-sm text-slate-400">No RFIs yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rfis.map(r => (
                <li key={r.id} className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-slate-700">{r.header || 'No header'}</span>
                      {r.sent_to_name && <span className="text-xs text-slate-500">{r.sent_to_name}</span>}
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[r.status] || 'bg-slate-100 text-slate-500'}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <RFIActions rfi={r} bid={bid} settings={settings} />
                    <Link
                      href={`/bids/${bid.id}/rfi?id=${r.id}`}
                      className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded hover:bg-slate-100 text-xs font-medium ml-1"
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
