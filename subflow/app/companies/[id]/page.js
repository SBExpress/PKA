import { redirect, notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import CompanyForm from '@/components/forms/CompanyForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function CompanyDetailPage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!company) notFound()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('company_id', id)
    .eq('user_id', user.id)
    .order('created_at')

  company.contacts = contacts || []

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/companies" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Edit Company</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm max-w-2xl p-8">
          <CompanyForm company={company} />
        </div>
      </main>
    </div>
  )
}
