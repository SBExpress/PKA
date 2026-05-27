import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import CustomerForm from '@/components/forms/CustomerForm'

export default async function NewCustomerPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Add Customer</h1>
        <div className="bg-white rounded-xl shadow-sm max-w-2xl p-8">
          <CustomerForm />
        </div>
      </main>
    </div>
  )
}
