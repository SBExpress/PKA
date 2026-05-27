import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import ContactForm from '@/components/forms/ContactForm'
import { ArrowLeft } from 'lucide-react'

export default async function ContactDetailPage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contact } = await supabase.from('contacts').select('*, customers(id, company_name)').eq('id', id).single()
  if (!contact) notFound()

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/customers/${contact.customers?.id}`} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{[contact.first_name, contact.last_name].filter(Boolean).join(' ')}</h1>
            {contact.customers && <p className="text-slate-400 text-sm">{contact.customers.company_name}</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm max-w-xl p-8">
          <ContactForm contact={contact} customerId={contact.customer_id} />
        </div>
      </main>
    </div>
  )
}
