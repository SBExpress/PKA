'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useOrganization } from '@/lib/useOrganization'
import { useState, useEffect } from 'react'
import { LayoutDashboard, FolderOpen, Building2, Users, FileText, Settings, LogOut, Shield, ChevronDown, ChevronUp, Mail, Phone } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/bids', label: 'Bid Requests', icon: FolderOpen },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { org, isAdmin, loading } = useOrganization()
  const [companies, setCompanies] = useState([])
  const [expandedCompany, setExpandedCompany] = useState(null)
  const [companiesLoading, setCompaniesLoading] = useState(true)

  useEffect(() => {
    if (!org) return
    loadCompanies()
  }, [org])

  async function loadCompanies() {
    setCompaniesLoading(true)
    const { data } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        contacts(id, name, email, phone, cellphone, title)
      `)
      .eq('organization_id', org.id)
      .order('name')
    if (data) {
      setCompanies(data)
    }
    setCompaniesLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-72 min-h-screen bg-slate-900 flex flex-col overflow-y-auto">
      <div className="px-6 py-5 border-b border-slate-700 sticky top-0 bg-slate-900">
        <span className="text-white font-bold text-lg tracking-tight">SubFlow</span>
        {!loading && org && (
          <p className="text-xs text-slate-400 mt-2">{org.name}</p>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}

        {/* Companies & Contacts Section */}
        {!companiesLoading && companies.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Companies</p>
            <div className="space-y-2">
              {companies.map(company => (
                <div key={company.id} className="space-y-1">
                  <button
                    onClick={() => setExpandedCompany(expandedCompany === company.id ? null : company.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-left"
                  >
                    {expandedCompany === company.id ? (
                      <ChevronUp size={14} className="flex-shrink-0" />
                    ) : (
                      <ChevronDown size={14} className="flex-shrink-0" />
                    )}
                    <Building2 size={14} className="flex-shrink-0" />
                    <span className="truncate">{company.name}</span>
                  </button>

                  {expandedCompany === company.id && company.contacts && company.contacts.length > 0 && (
                    <div className="space-y-1 pl-6">
                      {company.contacts.map(contact => (
                        <Link
                          key={contact.id}
                          href={`/contacts/${contact.id}`}
                          className="block p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                        >
                          <p className="text-xs font-medium text-slate-300 truncate">{contact.name}</p>
                          {contact.title && <p className="text-xs text-slate-500 truncate">{contact.title}</p>}
                          <div className="flex gap-2 mt-1">
                            {contact.email && (
                              <a
                                href={`mailto:${contact.email}`}
                                onClick={e => e.stopPropagation()}
                                className="text-slate-400 hover:text-blue-400 transition-colors"
                                title={contact.email}
                              >
                                <Mail size={12} />
                              </a>
                            )}
                            {contact.phone && (
                              <a
                                href={`tel:${contact.phone}`}
                                onClick={e => e.stopPropagation()}
                                className="text-slate-400 hover:text-blue-400 transition-colors"
                                title={contact.phone}
                              >
                                <Phone size={12} />
                              </a>
                            )}
                            {contact.cellphone && (
                              <a
                                href={`tel:${contact.cellphone}`}
                                onClick={e => e.stopPropagation()}
                                className="text-slate-400 hover:text-blue-400 transition-colors"
                                title={contact.cellphone}
                              >
                                <Phone size={12} />
                              </a>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-4 border-t border-slate-700 pt-4 ${
              pathname.startsWith('/admin')
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield size={16} />
            Admin
          </Link>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 w-full transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
