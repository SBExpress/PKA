'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const statusColor = {
  received: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-purple-100 text-purple-700',
  declined: 'bg-slate-100 text-slate-600',
  awarded: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
}

const statusOptions = [
  'received',
  'in_progress',
  'submitted',
  'declined',
  'awarded',
  'lost',
]

export default function BidsListTable({ initialBids, orgId }) {
  const supabase = createClient()
  const [bids, setBids] = useState(initialBids)
  const [editingId, setEditingId] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const handleEditStart = (bidId, field, value) => {
    setEditingId(bidId)
    setEditingField(field)
    setEditValue(value || '')
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingField(null)
    setEditValue('')
  }

  const handleEditSave = useCallback(async (bidId, field, value) => {
    setSaving(true)
    try {
      const updateData = {}

      if (field === 'bid_due_date') {
        updateData.bid_due_date = value || null
      } else if (field === 'status') {
        updateData.status = value
      } else if (field === 'notes') {
        updateData.notes = value
      }

      const { error } = await supabase
        .from('bid_requests')
        .update(updateData)
        .eq('id', bidId)
        .eq('organization_id', orgId)

      if (error) throw error

      // Update local state
      setBids(bids.map(b => b.id === bidId ? { ...b, [field]: value } : b))
      setEditingId(null)
      setEditingField(null)
    } catch (err) {
      console.error('Error saving:', err)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }, [supabase, orgId, bids])

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {!bids?.length ? (
        <p className="px-6 py-12 text-slate-400 text-sm text-center">No bid requests yet. Add your first one.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              <th className="px-6 py-3 font-medium text-slate-500">Project</th>
              <th className="px-6 py-3 font-medium text-slate-500">Customer</th>
              <th className="px-6 py-3 font-medium text-slate-500">Due Date</th>
              <th className="px-6 py-3 font-medium text-slate-500">Status</th>
              <th className="px-6 py-3 font-medium text-slate-500">Proposal Header</th>
              <th className="px-6 py-3 font-medium text-slate-500">Latest Proposal</th>
              <th className="px-6 py-3 font-medium text-slate-500">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bids.map(bid => (
              <tr key={bid.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/bids/${bid.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                    {bid.project_name}
                  </Link>
                  {bid.project_address && <p className="text-slate-400 text-xs mt-0.5">{bid.project_address}</p>}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {bid.customer_name || '—'}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {editingId === bid.id && editingField === 'bid_due_date' ? (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                        disabled={saving}
                      />
                      <button
                        onClick={() => handleEditSave(bid.id, 'bid_due_date', editValue)}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                        disabled={saving}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-2 py-1 bg-slate-300 text-slate-700 rounded text-xs hover:bg-slate-400"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={() => handleEditStart(bid.id, 'bid_due_date', bid.bid_due_date)}
                      className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded"
                    >
                      {bid.bid_due_date ? formatDate(bid.bid_due_date) : 'TBD'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === bid.id && editingField === 'status' ? (
                    <div className="flex gap-2">
                      <select
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs"
                        disabled={saving}
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleEditSave(bid.id, 'status', editValue)}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                        disabled={saving}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-2 py-1 bg-slate-300 text-slate-700 rounded text-xs hover:bg-slate-400"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={() => handleEditStart(bid.id, 'status', bid.status)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer inline-block ${statusColor[bid.status] || 'bg-slate-100 text-slate-600'}`}
                    >
                      {bid.status?.replace('_', ' ')}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {bid.latestProposalHeader ? (
                    <span className="text-sm font-medium text-slate-800">{bid.latestProposalHeader}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {bid.latestProposalRevision !== null ? (
                    <div className="text-sm">
                      <span className="font-medium">Rev {bid.latestProposalRevision}</span>
                      {bid.latestProposalCost && (
                        <p className="text-green-700 font-medium">${Number(bid.latestProposalCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {editingId === bid.id && editingField === 'notes' ? (
                    <div className="flex gap-2">
                      <textarea
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs w-32"
                        rows="2"
                        disabled={saving}
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleEditSave(bid.id, 'notes', editValue)}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                          disabled={saving}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="px-2 py-1 bg-slate-300 text-slate-700 rounded text-xs hover:bg-slate-400"
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span
                      onClick={() => handleEditStart(bid.id, 'notes', bid.notes)}
                      className="cursor-pointer hover:bg-slate-100 px-2 py-1 rounded block max-w-xs truncate"
                      title={bid.notes}
                    >
                      {bid.notes || '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
