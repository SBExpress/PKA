'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useOrganization } from '@/lib/useOrganization'
import GoogleAddressInput from '@/components/GoogleAddressInput'
import { Trash2 } from 'lucide-react'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'block text-sm font-medium text-slate-700 mb-1'

export default function CompanyForm({ company, onSaved }) {
  const router = useRouter()
  const supabase = createClient()
  const { org, loading: orgLoading } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: company?.name || '',
    email: company?.email || '',
    phone: company?.phone || '',
    type: company?.type || '',
    address: company?.address || '',
    address_lat: company?.address_lat || null,
    address_lng: company?.address_lng || null,
    notes: company?.notes || '',
  })
  const [contacts, setContacts] = useState(company?.contacts || [])
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', title: '' })

  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  function addContact() {
    if (!newContact.name.trim()) return
    setContacts(p => [...p, { ...newContact, _isNew: true, id: Date.now() }])
    setNewContact({ name: '', email: '', phone: '', title: '' })
  }

  function removeContact(id) {
    setContacts(p => p.filter(c => c.id !== id))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.type) {
      setError('Company name and type are required')
      return
    }
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()

    try {
      if (company) {
        const { error } = await supabase.from('companies').update({ ...form, updated_at: new Date().toISOString() }).eq('id', company.id)
        if (error) throw new Error(error.message)

        // Handle contacts
        for (const contact of contacts) {
          if (contact._isNew) {
            // New contact - insert
            const { name, email, phone, title } = contact
            await supabase.from('contacts').insert({ name, email, phone, title, company_id: company.id, user_id: user.id, organization_id: org.id })
          } else if (typeof contact.id === 'string') {
            // Existing contact - update
            await supabase.from('contacts').update({ name: contact.name, email: contact.email, phone: contact.phone, title: contact.title }).eq('id', contact.id)
          }
        }

        if (onSaved) { onSaved(company.id); return }
        router.push(`/companies/${company.id}`)
      } else {
        const { data, error } = await supabase.from('companies').insert({ ...form, user_id: user.id, organization_id: org.id }).select().single()
        if (error) throw new Error(error.message)

        // Insert new contacts
        for (const contact of contacts) {
          if (contact._isNew || typeof contact.id !== 'string') {
            const { name, email, phone, title } = contact
            await supabase.from('contacts').insert({ name, email, phone, title, company_id: data.id, user_id: user.id, organization_id: org.id })
          }
        }

        if (onSaved) { onSaved(data.id); return }
        router.push(`/companies/${data.id}`)
      }
      router.refresh()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

      <div>
        <label className={lbl}>Company Name *</label>
        <input required className={field} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Enter company name" />
      </div>

      <div>
        <label className={lbl}>Company Type *</label>
        <select required className={field} value={form.type} onChange={e => set('type', e.target.value)}>
          <option value="">Select type...</option>
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
          <option value="both">Both (Customer & Vendor)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Email</label>
          <input type="email" className={field} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
        </div>
        <div>
          <label className={lbl}>Phone</label>
          <input className={field} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone number" />
        </div>
      </div>

      <div>
        <label className={lbl}>Address</label>
        <GoogleAddressInput
          value={form.address}
          onChange={addr => set('address', addr)}
          onLocationChange={loc => {
            set('address', loc.address)
            set('address_lat', loc.lat)
            set('address_lng', loc.lng)
          }}
        />
      </div>

      <div>
        <label className={lbl}>Notes</label>
        <textarea rows={2} className={field} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
      </div>

      {company && (
        <div className="pt-6 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Contacts</h3>

          {contacts.length > 0 && (
            <div className="space-y-3 mb-6">
              {contacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{contact.name}</p>
                    {contact.title && <p className="text-sm text-slate-600">{contact.title}</p>}
                    {contact.email && <p className="text-sm text-slate-600">{contact.email}</p>}
                    {contact.phone && <p className="text-sm text-slate-600">{contact.phone}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeContact(contact.id)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-lg space-y-3">
            <input
              type="text"
              className={field}
              placeholder="Contact name"
              value={newContact.name}
              onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
            />
            <input
              type="text"
              className={field}
              placeholder="Title"
              value={newContact.title}
              onChange={e => setNewContact(p => ({ ...p, title: e.target.value }))}
            />
            <input
              type="email"
              className={field}
              placeholder="Email"
              value={newContact.email}
              onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
            />
            <input
              type="text"
              className={field}
              placeholder="Phone"
              value={newContact.phone}
              onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))}
            />
            <button
              type="button"
              onClick={addContact}
              disabled={!newContact.name.trim()}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              Add Contact
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60">
          {loading ? 'Saving...' : company ? 'Save Changes' : 'Add Company'}
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
