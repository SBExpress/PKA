import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import BidForm from '@/components/forms/BidForm'

export default async function EditBidPage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bid } = await supabase.from('bid_requests').select('*').eq('id', id).single()
  if (!bid) redirect('/bids')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Edit Bid Request</h1>
        <div className="bg-white rounded-xl shadow-sm max-w-2xl p-8">
          <BidForm bid={bid} />
        </div>
      </main>
    </div>
  )
}
