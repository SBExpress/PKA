'use client'

import { useState } from 'react'
import { Edit2, ChevronDown, ChevronUp, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import CompanyForm from '@/components/forms/CompanyForm'

export default function CompanyDetailWrapper({ company }) {
  const [isEditing, setIsEditing] = useState(false)
  const [expandedContact, setExpandedContact] = useState(null)

  if (isEditing) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => setIsEditing(false)} className="mb-4 text-slate-600 text-sm font-medium hover:text-slate-800">
          ← Back
        </button>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <CompanyForm company={company} onSaved={() => setIsEditing(false)} />
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

        {company.contacts && company.contacts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Contacts ({company.contacts.length})</h3>
            <div className="space-y-3">
              {company.contacts.map(contact => (
                <div key={contact.id} className="border border-slate-100 rounded-lg p-4">
                  <button
                    onClick={() => setExpandedContact(expandedContact === contact.id ? null : contact.id)}
                    className="w-full flex items-start justify-between text-left cursor-pointer hover:bg-slate-50 -m-4 p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{contact.name}</p>
                      {contact.title && <p className="text-sm text-slate-600">{contact.title}</p>}
                    </div>
                    {expandedContact === contact.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {expandedContact === contact.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-slate-400" />
                          <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-slate-400" />
                          <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">{contact.phone}</a>
                        </div>
                      )}
                      {contact.cellphone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-slate-400" />
                          <span className="text-slate-600">{contact.cellphone}</span>
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
                      <div className="pt-2">
                        <Link href={`/contacts/${contact.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          Edit Contact →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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
