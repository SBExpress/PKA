'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function BidDetailsSection({ bid, address, customerName, contactName, email, phone, cellphone, orgId }) {
  const supabase = createClient()
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(bid.notes || '')
  const [saving, setSaving] = useState(false)

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleSaveNotes = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('bid_requests')
        .update({ notes: notesValue })
        .eq('id', bid.id)
        .eq('organization_id', orgId)

      if (error) throw error
      setEditingNotes(false)
    } catch (err) {
      console.error('Error saving notes:', err)
      alert('Failed to save notes')
    } finally {
      setSaving(false)
    }
  }

  const details = [
    ['Address', address],
    ['Company', customerName],
    ['Contact', contactName],
    ['Email', email],
    ['Phone', phone],
    ['Cell Phone', cellphone],
    ['Received', formatDate(bid.received_date)],
    ['Bid Due', bid.bid_due_date ? formatDate(bid.bid_due_date) : 'TBD'],
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 col-span-2">
      <h2 className="font-semibold text-slate-700 mb-4">Project Info</h2>
      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        {details.map(([k, v]) => (
          <div key={k}>
            <span className="text-slate-400">{k}: </span>
            <span className="text-slate-700">{v || '—'}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-slate-400 text-sm mb-1">Notes</p>
        {editingNotes ? (
          <div className="flex gap-2">
            <textarea
              value={notesValue}
              onChange={e => setNotesValue(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              disabled={saving}
            />
            <div className="flex flex-col gap-1">
              <button
                onClick={handleSaveNotes}
                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 font-medium"
                disabled={saving}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingNotes(false)
                  setNotesValue(bid.notes || '')
                }}
                className="px-3 py-1 bg-slate-300 text-slate-700 rounded text-xs hover:bg-slate-400 font-medium"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditingNotes(true)}
            className="cursor-pointer hover:bg-slate-50 px-2 py-2 rounded border border-transparent hover:border-slate-200 min-h-12 flex items-center"
          >
            {bid.notes ? (
              <p className="text-slate-700 text-sm whitespace-pre-wrap">{bid.notes}</p>
            ) : (
              <p className="text-slate-400 text-sm italic">Click to add notes...</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
