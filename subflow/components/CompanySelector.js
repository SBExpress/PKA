'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, X } from 'lucide-react'

export default function CompanySelector({ filterType, onSelectCompany, selectedCompanyId, onCompanyCreated, label }) {
  const supabase = createClient()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newCompany, setNewCompany] = useState({ name: '', email: '', phone: '', type: '', notes: '' })
  const [creatingCompany, setCreatingCompany] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [filterType])

  async function loadCompanies() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .in('type', filterType === 'customer' ? ['customer', 'both'] : ['vendor', 'both'])
      .order('name', { ascending: true })
    setCompanies(data || [])
    setLoading(false)
  }

  async function handleCreateCompany() {
    if (!newCompany.name || !newCompany.type) {
      alert('Company name and type are required')
      return
    }
    setCreatingCompany(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('companies')
      .insert({
        user_id: user.id,
        name: newCompany.name,
        email: newCompany.email,
        phone: newCompany.phone,
        type: newCompany.type,
        notes: newCompany.notes,
      })
      .select()
      .single()

    if (!error && data) {
      setCompanies(c => [...c, data])
      onCompanyCreated(data)
      setNewCompany({ name: '', email: '', phone: '', type: '', notes: '' })
      setShowNewForm(false)
    }
    setCreatingCompany(false)
  }

  const selected = companies.find(c => c.id === selectedCompanyId)

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="flex gap-2">
          <select
            value={selectedCompanyId || ''}
            onChange={(e) => {
              const company = companies.find(c => c.id === e.target.value)
              if (company) onSelectCompany(company)
            }}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select company...</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Plus size={14} /> New
          </button>
        </div>
      </div>

      {showNewForm && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-700">Add New Company</h3>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Company Name *"
            value={newCompany.name}
            onChange={e => setNewCompany(c => ({ ...c, name: e.target.value }))}
            className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Company Type *</label>
            <select
              value={newCompany.type}
              onChange={e => setNewCompany(c => ({ ...c, type: e.target.value }))}
              className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
            >
              <option value="">Select type...</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="both">Both (Customer & Vendor)</option>
            </select>
          </div>

          <input
            type="email"
            placeholder="Email"
            value={newCompany.email}
            onChange={e => setNewCompany(c => ({ ...c, email: e.target.value }))}
            className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={newCompany.phone}
            onChange={e => setNewCompany(c => ({ ...c, phone: e.target.value }))}
            className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
          />

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleCreateCompany}
              disabled={creatingCompany || !newCompany.name || !newCompany.type}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded transition-colors disabled:opacity-60"
            >
              {creatingCompany ? 'Creating...' : 'Create Company'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-3 py-2 text-slate-600 border border-slate-200 rounded text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
