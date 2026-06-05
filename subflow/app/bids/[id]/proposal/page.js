import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import ProposalForm from '@/components/forms/ProposalForm'

export default async function ProposalPage({ params, searchParams }) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bid } = await supabase.from('bid_requests').select('*').eq('id', id).single()
  if (!bid) redirect('/bids')

  const { data: revCount } = await supabase.from('proposals').select('id', { count: 'exact' }).eq('bid_request_id', bid.id)
  const nextRevision = revCount?.length || 0

  let proposal = null

  if (sp?.id) {
    const { data } = await supabase.from('proposals').select('*').eq('id', sp.id).single()
    proposal = data
  } else if (sp?.from) {
    const { data: source } = await supabase.from('proposals').select('*').eq('id', sp.from).single()
    if (source) {
      proposal = { ...source, id: null, revision: nextRevision }
    }
  }

  const isRevision = !!sp?.from
  const title = proposal?.id
    ? `Edit Proposal Rev ${proposal.revision}`
    : isRevision
    ? `New Revision (Rev ${nextRevision})`
    : 'New Proposal'

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">{title}</h1>
        <p className="text-slate-400 text-sm mb-6">{bid.project_name}</p>
        <ProposalForm bid={bid} proposal={proposal} nextRevision={nextRevision} />
      </main>
    </div>
  )
}
