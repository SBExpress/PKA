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

  // Get user's organization
  const { data: membership } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) redirect('/login')

  const { data: contact } = await supabase
    .from('contacts')
    .select('*, companies:company_id(id, name)')
    .eq('id', id)
    .eq('organization_id', membership.organization_id)
    .single()
  if (!contact) notFound()

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/companies/${contact.companies?.id}`} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{contact.name}</h1>
            {contact.companies && <p className="text-slate-400 text-sm">{contact.companies.name}</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm max-w-xl p-8">
          <ContactForm contact={contact} companyId={contact.company_id} />
        </div>
      </main>
    </div>
  )
}
