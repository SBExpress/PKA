'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useOrganization } from '@/lib/useOrganization'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'block text-sm font-medium text-slate-700 mb-1'

export default function ContactForm({ contact, companyId, onSaved }) {
  const router = useRouter()
  const supabase = createClient()
  const { org } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState([])
  const [showNewCompany, setShowNewCompany] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [form, setForm] = useState({
    name: contact?.name || '',
    title: contact?.title || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    company_id: companyId || contact?.company_id || '',
  })

  useEffect(() => {
    if (!org) return
    supabase
      .from('companies')
      .select('id, name')
      .eq('organization_id', org.id)
      .order('name')
      .then(({ data }) => setCompanies(data || []))
  }, [org, supabase])

  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  async function addCompanyInline() {
    if (!newCompanyName.trim() || !org) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('companies')
      .insert({ name: newCompanyName.trim(), type: 'customer', user_id: user.id, organization_id: org.id })
      .select()
      .single()
    if (data) {
      setCompanies(c => [...c, { id: data.id, name: data.name }].sort((a, b) => a.name.localeCompare(b.name)))
      set('company_id', data.id)
      setNewCompanyName('')
      setShowNewCompany(false)
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!org || !form.company_id) {
      setError('Please select a company')
      return
    }
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()

    if (contact) {
      const { error } = await supabase
        .from('contacts')
        .update({
          name: form.name,
          title: form.title,
          email: form.email,
          phone: form.phone,
          company_id: form.company_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', contact.id)
      if (error) { setError(error.message); setLoading(false); return }
      if (onSaved) { onSaved(contact.id); return }
      router.back()
    } else {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          name: form.name,
          title: form.title,
          email: form.email,
          phone: form.phone,
          company_id: form.company_id,
          user_id: user.id,
          organization_id: org.id
        })
        .select()
        .single()
      if (error) { setError(error.message); setLoading(false); return }
      if (onSaved) { onSaved(data.id); return }
      router.back()
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={lbl}>Company *</label>
          <button
            type="button"
            onClick={() => setShowNewCompany(!showNewCompany)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            + New Company
          </button>
        </div>
        {showNewCompany && (
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className={field}
              placeholder="Company name"
              value={newCompanyName}
              onChange={e => setNewCompanyName(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              onClick={addCompanyInline}
              disabled={loading || !newCompanyName.trim()}
              className="bg-blue-600 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap disabled:opacity-60"
            >
              Add
            </button>
          </div>
        )}
        <select
          required
          className={field}
          value={form.company_id}
          onChange={e => set('company_id', e.target.value)}
        >
          <option value="">Select a company...</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={lbl}>Contact Name *</label>
        <input
          required
          className={field}
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Full name"
        />
      </div>

      <div>
        <label className={lbl}>Title</label>
        <input
          className={field}
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Project Manager, Estimator, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Email</label>
          <input
            type="email"
            className={field}
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
        </div>
        <div>
          <label className={lbl}>Phone</label>
          <input
            className={field}
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60">
          {loading ? 'Saving...' : contact ? 'Save Changes' : 'Add Contact'}
        </button>
        {!onSaved && (
          <button type="button" onClick={() => router.back()} className="text-slate-600 text-sm font-medium px-5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
