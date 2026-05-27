import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import ContactForm from '@/components/forms/ContactForm'

export default async function NewContactPage({ searchParams }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const customerId = searchParams?.customer || null
  let customer = null
  if (customerId) {
    const { data } = await supabase.from('customers').select('company_name').eq('id', customerId).single()
    customer = data
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Add Contact</h1>
        {customer && <p className="text-slate-400 text-sm mb-6">{customer.company_name}</p>}
        <div className="bg-white rounded-xl shadow-sm max-w-xl p-8">
          <ContactForm customerId={customerId} />
        </div>
      </main>
    </div>
  )
}
