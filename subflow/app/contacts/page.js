import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabaseServer'
import Sidebar from '@/components/Sidebar'
import { Plus, Building2 } from 'lucide-react'

export default async function ContactsPage() {
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

  if (!membership) {
    redirect('/login')
  }

  // Get all contacts with company info
  const { data: contacts } = await supabase
    .from('contacts')
    .select(`
      id,
      name,
      email,
      phone,
      title,
      company_id,
      companies:company_id(name),
      created_at
    `)
    .eq('organization_id', membership.organization_id)
    .order('name')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Contacts</h1>
          <Link
            href="/contacts/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} /> Add Contact
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          {!contacts?.length ? (
            <p className="px-6 py-12 text-slate-400 text-sm text-center">
              No contacts yet. Import or add your first contact.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-6 py-3 font-medium text-slate-500">Name</th>
                  <th className="px-6 py-3 font-medium text-slate-500">
                    Company
                  </th>
                  <th className="px-6 py-3 font-medium text-slate-500">Title</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Email</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium text-slate-800 hover:text-blue-600"
                      >
                        {contact.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Building2
                          size={14}
                          className="text-slate-400"
                        />
                        {contact.company_id ? (
                          <Link
                            href={`/companies/${contact.company_id}`}
                            className="text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {contact.companies?.name}
                          </Link>
                        ) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {contact.title || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {contact.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {contact.phone || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
