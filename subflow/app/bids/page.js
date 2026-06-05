import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import BidsListTable from '@/components/BidsListTable'
import { Plus } from 'lucide-react'

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

  // Fetch bids with company names
  const { data: bids } = await supabase
    .from('bid_requests')
    .select('*, companies:customer_id(name)')
    .eq('organization_id', membership.organization_id)
    .order('created_at', { ascending: false })

  // Map companies relationship to customer_name for the component
  const bidsWithCustomerNames = bids?.map(bid => ({
    ...bid,
    customer_name: bid.companies?.name || '',
  })) || []

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

        <BidsListTable initialBids={bidsWithCustomerNames} orgId={membership.organization_id} />
      </main>
    </div>
  )
}
