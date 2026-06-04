'use client'

import { useState } from 'react'
import { Edit2, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import ContactForm from '@/components/forms/ContactForm'

export default function ContactDetailWrapper({ contact, relatedBids }) {
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(contact.notes || '')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      const { error } = await supabase
        .from('contacts')
        .update({ notes })
        .eq('id', contact.id)
      if (!error) {
        contact.notes = notes
      }
    } catch (err) {
      console.error('Failed to save notes:', err)
    }
    setIsSavingNotes(false)
  }

  if (isEditing) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => setIsEditing(false)} className="mb-4 text-slate-600 text-sm font-medium hover:text-slate-800">
          ← Back
        </button>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <ContactForm contact={contact} onSaved={() => setIsEditing(false)} />
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
              <h2 className="text-2xl font-bold text-slate-800">{contact.name}</h2>
              {contact.title && <p className="text-sm text-slate-600 mt-1">{contact.title}</p>}
            </div>
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
              <Edit2 size={16} /> Edit
            </button>
          </div>

          <div className="space-y-3 text-sm mt-4">
            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-slate-400" />
                <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">{contact.phone}</a>
              </div>
            )}
            {contact.cellphone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-slate-400" />
                <a href={`tel:${contact.cellphone}`} className="text-blue-600 hover:underline">{contact.cellphone}</a>
              </div>
            )}
            {contact.address && (
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-slate-400 mt-0.5" />
                <span className="text-slate-600">{contact.address}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Add notes about this contact..."
          />
          <button
            onClick={handleSaveNotes}
            disabled={isSavingNotes || notes === (contact.notes || '')}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {isSavingNotes ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>

      {contact.company_id && (
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Company</h3>
            {contact.company_name && (
              <Link href={`/companies/${contact.company_id}`} className="text-blue-600 hover:text-blue-700 font-medium">
                {contact.company_name}
              </Link>
            )}
          </div>

          {relatedBids && relatedBids.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Related Bids</h3>
              <div className="space-y-2">
                {relatedBids.map(bid => {
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
          )}
        </div>
      )}
    </div>
  )
}
