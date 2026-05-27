'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, X } from 'lucide-react'

export default function ContactSelector({ type, onSelectContact, selectedContactId, onContactCreated, label }) {
  const supabase = createClient()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', company: '', email: '', phone: '', notes: '' })
  const [creatingContact, setCreatingContact] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [type])

  async function loadContacts() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .in('contact_type', type === 'customer' ? ['customer', 'both'] : ['vendor', 'both'])
      .order('company', { ascending: true })
    setContacts(data || [])
    setLoading(false)
  }

  async function handleCreateContact() {
    setCreatingContact(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        name: newContact.name,
        company: newContact.company,
        email: newContact.email,
        phone: newContact.phone,
        notes: newContact.notes,
        contact_type: type === 'customer' ? 'customer' : 'vendor',
      })
      .select()
      .single()

    if (!error && data) {
      setContacts(c => [...c, data])
      onContactCreated(data)
      setNewContact({ name: '', company: '', email: '', phone: '', notes: '' })
      setShowNewForm(false)
    }
    setCreatingContact(false)
  }

  const selected = contacts.find(c => c.id === selectedContactId)

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="flex gap-2">
          <select
            value={selectedContactId || ''}
            onChange={(e) => {
              const contact = contacts.find(c => c.id === e.target.value)
              if (contact) onSelectContact(contact)
            }}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select {type}...</option>
            {contacts.map(c => (
              <option key={c.id} value={c.id}>
                {c.company || c.name}
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
            <h3 className="text-sm font-medium text-slate-700">Add New {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
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
            placeholder="Name"
            value={newContact.name}
            onChange={e => setNewContact(c => ({ ...c, name: e.target.value }))}
            className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Company"
            value={newContact.company}
            onChange={e => setNewContact(c => ({ ...c, company: e.target.value }))}
            className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={newContact.email}
            onChange={e => setNewContact(c => ({ ...c, email: e.target.value }))}
            className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={newContact.phone}
            onChange={e => setNewContact(c => ({ ...c, phone: e.target.value }))}
            className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm"
          />

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleCreateContact}
              disabled={creatingContact || !newContact.name}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded transition-colors disabled:opacity-60"
            >
              {creatingContact ? 'Creating...' : 'Create Contact'}
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
