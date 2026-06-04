import { redirect, notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import ContactDetailWrapper from '@/components/ContactDetailWrapper'
import Link from 'next/link'
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
    .select('*')
    .eq('id', id)
    .eq('organization_id', membership.organization_id)
    .single()

  if (!contact) notFound()

  // Get company name
  let company_name = null
  if (contact.company_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', contact.company_id)
      .single()
    company_name = company?.name
  }

  // Get related bids
  const { data: relatedBids } = await supabase
    .from('bid_requests')
    .select('id, project_name, status, bid_due_date')
    .eq('contact_id', id)
    .eq('organization_id', membership.organization_id)
    .order('bid_due_date', { ascending: true })

  contact.company_name = company_name

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/contacts" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">{contact.name}</h1>
        </div>
        <ContactDetailWrapper contact={contact} relatedBids={relatedBids || []} />
      </main>
    </div>
  )
}
