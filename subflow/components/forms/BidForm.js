'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { Plus } from 'lucide-react'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'block text-sm font-medium text-slate-700 mb-1'

export default function BidForm({ bid }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState([])
  const [contacts, setContacts] = useState([])
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [showNewContact, setShowNewContact] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newContactFirst, setNewContactFirst] = useState('')
  const [newContactLast, setNewContactLast] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')

  const [form, setForm] = useState({
    project_name: bid?.project_name || '',
    address: bid?.address || '',
    address2: bid?.address2 || '',
    city: bid?.city || '',
    state: bid?.state || '',
    zip: bid?.zip || '',
    customer_id: bid?.customer_id || '',
    contact_id: bid?.contact_id || '',
    bid_due_date: bid?.bid_due_date || '',
    received_date: bid?.received_date || new Date().toISOString().slice(0, 10),
    status: bid?.status || 'received',
    notes: bid?.notes || '',
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

  useEffect(() => {
    supabase.from('customers').select('id, company_name').order('company_name').then(({ data }) => setCustomers(data || []))
  }, [])

  useEffect(() => {
    if (!form.customer_id) { setContacts([]); return }
    supabase.from('contacts').select('id, first_name, last_name').eq('customer_id', form.customer_id).order('last_name').then(({ data }) => setContacts(data || []))
  }, [form.customer_id])

  async function addCustomerInline() {
    if (!newCustomerName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('customers').insert({ company_name: newCustomerName.trim(), user_id: user.id }).select().single()
    if (data) {
      setCustomers(c => [...c, data].sort((a, b) => a.company_name.localeCompare(b.company_name)))
      set('customer_id', data.id)
      setNewCustomerName('')
      setShowNewCustomer(false)
    }
  }

  async function addContactInline() {
    if (!form.customer_id) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('contacts').insert({
      first_name: newContactFirst.trim(),
      last_name: newContactLast.trim(),
      email: newContactEmail.trim(),
      phone: newContactPhone.trim(),
      customer_id: form.customer_id,
      user_id: user.id,
    }).select().single()
    if (data) {
      setContacts(c => [...c, data])
      set('contact_id', data.id)
      setNewContactFirst(''); setNewContactLast(''); setNewContactEmail(''); setNewContactPhone('')
      setShowNewContact(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()

    if (bid) {
      const { error } = await supabase.from('bid_requests').update({ ...form, updated_at: new Date().toISOString() }).eq('id', bid.id)
      if (error) { setError(error.message); setLoading(false); return }
      router.push(`/bids/${bid.id}`)
    } else {
      const { data, error } = await supabase.from('bid_requests').insert({ ...form, user_id: user.id }).select().single()
      if (error) { setError(error.message); setLoading(false); return }
      router.push(`/bids/${data.id}`)
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

      <div>
        <label className={lbl}>Project Name *</label>
        <input required className={field} value={form.project_name} onChange={e => set('project_name', e.target.value)} />
      </div>

      <div>
        <label className={lbl}>Project Address</label>
        <AddressAutocomplete value={form.address} onChange={handleAddressChange} placeholder="Start typing to search..." />
      </div>
      <div>
        <label className={lbl}>Address Line 2</label>
        <input className={field} value={form.address2} onChange={e => set('address2', e.target.value)} placeholder="Suite, Building, etc." />
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

      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between mb-1">
          <label className={lbl + ' mb-0'}>Customer (GC)</label>
          <button type="button" onClick={() => setShowNewCustomer(!showNewCustomer)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Plus size={12} /> New Customer
          </button>
        </div>
        {showNewCustomer && (
          <div className="flex gap-2 mb-2">
            <input className={field} placeholder="Company name" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
            <button type="button" onClick={addCustomerInline} className="bg-blue-600 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">Add</button>
          </div>
        )}
        <select className={field} value={form.customer_id} onChange={e => { set('customer_id', e.target.value); set('contact_id', '') }}>
          <option value="">Select a customer...</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
        </select>
      </div>

      {form.customer_id && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={lbl + ' mb-0'}>Contact</label>
            <button type="button" onClick={() => setShowNewContact(!showNewContact)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Plus size={12} /> New Contact
            </button>
          </div>
          {showNewContact && (
            <div className="space-y-2 mb-2 p-3 bg-slate-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                <input className={field} placeholder="First name" value={newContactFirst} onChange={e => setNewContactFirst(e.target.value)} />
                <input className={field} placeholder="Last name" value={newContactLast} onChange={e => setNewContactLast(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className={field} placeholder="Email" value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} />
                <input className={field} placeholder="Phone" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} />
              </div>
              <button type="button" onClick={addContactInline} className="bg-blue-600 text-white text-xs px-3 py-2 rounded-lg">Add Contact</button>
            </div>
          )}
          <select className={field} value={form.contact_id} onChange={e => set('contact_id', e.target.value)}>
            <option value="">Select a contact...</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{[c.first_name, c.last_name].filter(Boolean).join(' ')}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <div>
          <label className={lbl}>Received Date</label>
          <input type="date" className={field} value={form.received_date} onChange={e => set('received_date', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Bid Due Date</label>
          <input type="date" className={field} value={form.bid_due_date} onChange={e => set('bid_due_date', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Status</label>
          <select className={field} value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="received">Received</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="declined">Declined</option>
            <option value="awarded">Awarded</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Notes</label>
          <textarea rows={2} className={field} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60">
          {loading ? 'Saving...' : bid ? 'Save Changes' : 'Create Bid Request'}
        </button>
        <button type="button" onClick={() => router.back()} className="text-slate-600 text-sm font-medium px-5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
