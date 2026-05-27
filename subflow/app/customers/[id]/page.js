import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import CustomerForm from '@/components/forms/CustomerForm'
import { Plus, ArrowLeft } from 'lucide-react'

export default async function CustomerDetailPage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await supabase.from('customers').select('*').eq('id', id).single()
  if (!customer) notFound()

  const { data: contacts } = await supabase.from('contacts').select('*').eq('customer_id', customer.id).order('last_name')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/customers" className="text-slate-400 hover:text-slate-600"><ArrowLeft size={18} /></Link>
          <h1 className="text-2xl font-bold text-slate-800">{customer.company_name}</h1>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl shadow-sm p-8">
            <h2 className="font-semibold text-slate-700 mb-4">Company Info</h2>
            <CustomerForm customer={customer} />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-700">Contacts</h2>
              <Link href={`/contacts/new?customer=${customer.id}`} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                <Plus size={13} /> Add
              </Link>
            </div>
            {!contacts?.length ? (
              <p className="text-slate-400 text-sm">No contacts yet.</p>
            ) : (
              <ul className="space-y-3">
                {contacts.map(c => (
                  <li key={c.id}>
                    <Link href={`/contacts/${c.id}`} className="block hover:bg-slate-50 rounded-lg p-2 transition-colors">
                      <p className="text-sm font-medium text-slate-800">{[c.first_name, c.last_name].filter(Boolean).join(' ')}</p>
                      {c.title && <p className="text-xs text-slate-400">{c.title}</p>}
                      {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
