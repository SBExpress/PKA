'use client'

import { useState } from 'react'
import { Edit2, ChevronDown, ChevronUp, Mail, Phone, MapPin, Plus, X } from 'lucide-react'
import Link from 'next/link'
import CompanyForm from '@/components/forms/CompanyForm'
import { createClient } from '@/lib/supabase'
import { useOrganization } from '@/lib/useOrganization'
import { useRouter } from 'next/navigation'

export default function CompanyDetailWrapper({ company: initialCompany }) {
  const router = useRouter()
  const supabase = createClient()
  const { org } = useOrganization()
  const [company, setCompany] = useState(initialCompany)
  const [isEditing, setIsEditing] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [addingContact, setAddingContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', cellphone: '', title: '', address: '', notes: '' })

  async function handleAddContact() {
    if (!newContact.name.trim() || !org) {
      alert('Contact name is required')
      return
    }
    setAddingContact(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        name: newContact.name,
        email: newContact.email || null,
        phone: newContact.phone || null,
        cellphone: newContact.cellphone || null,
        title: newContact.title || null,
        address: newContact.address || null,
        notes: newContact.notes || null,
        company_id: company.id,
        user_id: user.id,
        organization_id: org.id
      })
      .select()
      .single()

    setAddingContact(false)
    if (error) {
      alert('Failed to add contact: ' + error.message)
      return
    }

    if (data) {
      setCompany(prev => ({
        ...prev,
        contacts: [...(prev.contacts || []), data]
      }))
      setNewContact({ name: '', email: '', phone: '', cellphone: '', title: '', address: '', notes: '' })
      setShowAddContact(false)
      router.refresh()
    }
  }

  if (isEditing) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => setIsEditing(false)} className="mb-4 text-slate-600 text-sm font-medium hover:text-slate-800">
          ← Back
        </button>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <CompanyForm company={company} onSaved={() => { setIsEditing(false); router.refresh() }} />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{company.name}</h2>
              {company.type && <p className="text-sm text-slate-600 mt-1">Type: {company.type.replace('_', ' ')}</p>}
            </div>
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
              <Edit2 size={16} /> Edit
            </button>
          </div>

          <div className="space-y-3 text-sm mt-4">
            {company.email && (
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">{company.email}</a>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-slate-400" />
                <a href={`tel:${company.phone}`} className="text-blue-600 hover:underline">{company.phone}</a>
              </div>
            )}
            {company.address && (
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-slate-400 mt-0.5" />
                <span className="text-slate-600">{company.address}</span>
              </div>
            )}
          </div>

          {company.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-2">Notes</p>
              <p className="text-sm text-slate-600">{company.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Contacts ({company.contacts?.length || 0})</h3>
            {!showAddContact && (
              <button
                onClick={() => setShowAddContact(true)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus size={16} /> Add Contact
              </button>
            )}
          </div>

          {showAddContact && (
            <div className="bg-slate-50 p-4 rounded-lg mb-6 space-y-3 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Add New Contact</p>
                <button
                  onClick={() => setShowAddContact(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <input
                type="text"
                placeholder="Contact name *"
                value={newContact.name}
                onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={addingContact}
              />
              <input
                type="text"
                placeholder="Title"
                value={newContact.title}
                onChange={e => setNewContact(prev => ({ ...prev, title: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={addingContact}
              />
              <input
                type="email"
                placeholder="Email"
                value={newContact.email}
                onChange={e => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={addingContact}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Phone"
                  value={newContact.phone}
                  onChange={e => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={addingContact}
                />
                <input
                  type="text"
                  placeholder="Cell Phone"
                  value={newContact.cellphone}
                  onChange={e => setNewContact(prev => ({ ...prev, cellphone: e.target.value }))}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={addingContact}
                />
              </div>
              <input
                type="text"
                placeholder="Address"
                value={newContact.address}
                onChange={e => setNewContact(prev => ({ ...prev, address: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={addingContact}
              />
              <textarea
                placeholder="Notes"
                rows={2}
                value={newContact.notes}
                onChange={e => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={addingContact}
              />

              <div className="flex gap-2">
                <button
                  onClick={handleAddContact}
                  disabled={!newContact.name.trim() || addingContact}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  {addingContact ? 'Adding...' : 'Add Contact'}
                </button>
                <button
                  onClick={() => setShowAddContact(false)}
                  disabled={addingContact}
                  className="flex-1 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {company.contacts && company.contacts.length > 0 ? (
            <div className="space-y-4">
              {company.contacts.map(contact => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="border border-slate-100 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors block group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 group-hover:text-blue-600">{contact.name}</p>
                      {contact.title && <p className="text-sm text-slate-600">{contact.title}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={14} className="text-slate-400" />
                        <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline">{contact.email}</a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-slate-400" />
                        <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline">{contact.phone}</a>
                      </div>
                    )}
                    {contact.cellphone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-slate-400" />
                        <a href={`tel:${contact.cellphone}`} onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline">{contact.cellphone}</a>
                      </div>
                    )}
                    {contact.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin size={14} className="text-slate-400 mt-0.5" />
                        <span className="text-slate-600">{contact.address}</span>
                      </div>
                    )}
                    {contact.notes && (
                      <div className="text-sm text-slate-600 pt-2 border-t border-slate-100">
                        <p className="font-medium text-slate-700 mb-1">Notes</p>
                        <p>{contact.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 text-xs text-blue-600 group-hover:text-blue-700 font-medium">
                    View & Edit →
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">No contacts yet. Add one to get started.</p>
          )}
        </div>
      </div>

      {company.relatedBids && company.relatedBids.length > 0 && (
        <div className="col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Related Bids</h3>
            <div className="space-y-2">
              {company.relatedBids.map(bid => {
                const statusColor = {
                  received: 'bg-blue-100 text-blue-700',
                  in_progress: 'bg-yellow-100 text-yellow-700',
                  submitted: 'bg-purple-100 text-purple-700',
                  declined: 'bg-slate-100 text-slate-600',
                  awarded: 'bg-green-100 text-green-700',
                  lost: 'bg-red-100 text-red-700',
                }
                return (
                  <Link key={bid.id} href={`/bids/${bid.id}`} className="block p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group">
                    <p className="font-medium text-slate-800 group-hover:text-blue-600 text-sm">{bid.project_name}</p>
                    {bid.bid_due_date && (
                      <p className="text-xs text-slate-500 mt-1">
                        Due: {new Date(bid.bid_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full mt-2 ${statusColor[bid.status] || 'bg-slate-100 text-slate-600'}`}>
                      {bid.status.replace('_', ' ')}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
