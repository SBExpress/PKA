import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import BidForm from '@/components/forms/BidForm'

export default async function NewBidPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">New Bid Request</h1>
        <div className="bg-white rounded-xl shadow-sm max-w-2xl p-8">
          <BidForm />
        </div>
      </main>
    </div>
  )
}
