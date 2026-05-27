'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LayoutDashboard, FolderOpen, Building2, FileText, Settings, LogOut } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/bids', label: 'Bid Requests', icon: FolderOpen },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 min-h-screen bg-slate-900 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <span className="text-white font-bold text-lg tracking-tight">SubFlow</span>
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
