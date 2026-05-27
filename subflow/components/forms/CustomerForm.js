'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AddressAutocomplete from '@/components/AddressAutocomplete'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'block text-sm font-medium text-slate-700 mb-1'

export default function CustomerForm({ customer, onSaved }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    company_name: customer?.company_name || '',
    address: customer?.address || '',
    address2: customer?.address2 || '',
    city: customer?.city || '',
    state: customer?.state || '',
    zip: customer?.zip || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    notes: customer?.notes || '',
  })

  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  const handleAddressChange = useCallback((parts) => {
    setForm(p => ({
      ...p,
      address: parts.address ?? p.address,
      city: parts.city ?? p.city,
      state: parts.state ?? p.state,
      zip: parts.zip ?? p.zip,
    }))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()

    if (customer) {
      const { error } = await supabase.from('customers').update({ ...form, updated_at: new Date().toISOString() }).eq('id', customer.id)
      if (error) { setError(error.message); setLoading(false); return }
      if (onSaved) { onSaved(customer.id); return }
      router.push(`/customers/${customer.id}`)
    } else {
      const { data, error } = await supabase.from('customers').insert({ ...form, user_id: user.id }).select().single()
      if (error) { setError(error.message); setLoading(false); return }
      if (onSaved) { onSaved(data.id); return }
      router.push(`/customers/${data.id}`)
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

      <div>
        <label className={lbl}>Company Name *</label>
        <input required className={field} value={form.company_name} onChange={e => set('company_name', e.target.value)} />
      </div>

      <div>
        <label className={lbl}>Address</label>
        <AddressAutocomplete value={form.address} onChange={handleAddressChange} placeholder="Start typing to search..." />
      </div>
      <div>
        <label className={lbl}>Address Line 2</label>
        <input className={field} value={form.address2} onChange={e => set('address2', e.target.value)} placeholder="Suite, Floor, etc." />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className={lbl}>City</label>
          <input className={field} value={form.city} onChange={e => set('city', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>State</label>
          <input className={field} value={form.state} onChange={e => set('state', e.target.value)} maxLength={2} />
        </div>
        <div>
          <label className={lbl}>Zip</label>
          <input className={field} value={form.zip} onChange={e => set('zip', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Phone</label>
          <input className={field} value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Email</label>
          <input type="email" className={field} value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
      </div>

      <div>
        <label className={lbl}>Notes</label>
        <textarea rows={2} className={field} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60">
          {loading ? 'Saving...' : customer ? 'Save Changes' : 'Add Customer'}
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
