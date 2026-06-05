'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useOrganization } from '@/lib/useOrganization'
import { generateProposalPDF } from '@/lib/generatePDF'
import RichSectionEditor from '@/components/RichSectionEditor'
import ProposalPreview from '@/components/ProposalPreview'
import { Plus, Trash2 } from 'lucide-react'

const SECTION_KEYS = ['description', 'drawings_used', 'detailed_description', 'clarifications', 'work_not_included', 'terms']
const SECTION_LABELS = {
  description: 'Description',
  drawings_used: 'Drawings Referenced',
  detailed_description: 'Scope of Work',
  clarifications: 'Clarifications',
  work_not_included: 'Work Not Included',
  terms: 'Terms and Conditions',
}

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'block text-sm font-medium text-slate-700 mb-1'
const sectionCls = 'bg-white rounded-xl shadow-sm p-6 mb-4'
const sectionTitle = 'font-semibold text-slate-700 mb-4 text-base'

export default function ProposalForm({ bid, proposal, nextRevision }) {
  const router = useRouter()
  const supabase = createClient()
  const { org } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [contact, setContact] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [settings, setSettings] = useState(null)

  const [form, setForm] = useState({
    revision: proposal?.revision ?? nextRevision,
    date: proposal?.date || new Date().toISOString().slice(0, 10),
    proposal_header: proposal?.proposal_header || `${bid?.project_name || ''} - Rev ${proposal?.revision ?? nextRevision}`,
    total_price: proposal?.total_price || '',
    description: proposal?.description || '',
    drawings_used: proposal?.drawings_used || '',
    detailed_description: proposal?.detailed_description || '',
    clarifications: proposal?.clarifications || '',
    work_not_included: proposal?.work_not_included || '',
    terms: proposal?.terms || defaultTerms(),
    status: proposal?.status || 'draft',
    contact_id: proposal?.contact_id || bid?.contact_id || '',
  })

  const [priceBreakdown, setPriceBreakdown] = useState(proposal?.price_breakdown || [{ description: '', amount: '' }])
  const [alternates, setAlternates] = useState(proposal?.alternates || [])

  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  useEffect(() => {
    if (!org) return
    supabase.from('settings').select('*').eq('organization_id', org.id).single().then(({ data }) => { if (data) setSettings(data) })
  }, [org, supabase])

  useEffect(() => {
    const cid = form.contact_id || bid?.contact_id
    if (!cid) return
    const fetchContact = async () => {
      const { data } = await supabase.from('contacts').select('*').eq('id', cid).single()
      if (data) setContact(data)
    }
    fetchContact()
  }, [form.contact_id, bid?.contact_id, bid, supabase])

  useEffect(() => {
    if (!bid?.customer_id) return
    const fetchCompany = async () => {
      const { data } = await supabase.from('companies').select('*').eq('id', bid.customer_id).single()
      if (data) setCustomer(data)
    }
    fetchCompany()
  }, [bid?.customer_id, bid, supabase])

  async function handleSubmit(e, goBack = false) {
    e.preventDefault()
    if (!org) return
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { ...form, bid_request_id: bid.id, user_id: user.id, organization_id: org.id, price_breakdown: priceBreakdown, alternates }

    if (proposal?.id) {
      const { error } = await supabase.from('proposals').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', proposal.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.from('proposals').insert(payload)
      if (error) { setError(error.message); setLoading(false); return }
    }
    setLoading(false)
    if (goBack) {
      router.push(`/bids/${bid.id}`)
      router.refresh()
    }
  }

  async function handleGeneratePDF() {
    await generateProposalPDF({ ...form, bid, contact, customer, settings, price_breakdown: priceBreakdown, alternates })
  }

  const previewData = { ...form, bid, contact, customer, settings, price_breakdown: priceBreakdown, alternates }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
      {showPreview && <ProposalPreview data={previewData} onClose={() => setShowPreview(false)} />}

      <div className={sectionCls}>
        <p className={sectionTitle}>General</p>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className={lbl}>Revision #</label>
            <input type="number" className={field} value={form.revision} onChange={e => set('revision', parseInt(e.target.value))} />
          </div>
          <div>
            <label className={lbl}>Date</label>
            <input type="date" className={field} value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Status</label>
            <select className={field} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="signed">Signed</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
        <div>
          <label className={lbl}>Proposal Header</label>
          <input className={field} value={form.proposal_header} onChange={e => set('proposal_header', e.target.value)} placeholder="e.g., Project Name - Rev 1" />
          <p className="text-xs text-slate-400 mt-1">This header is displayed at the top of the proposal document</p>
        </div>
      </div>

      {SECTION_KEYS.map(key => (
        <div key={key} className={sectionCls}>
          <p className="font-semibold text-slate-700 text-base mb-3">{SECTION_LABELS[key]}</p>
          <RichSectionEditor sectionKey={key} value={form[key]} onChange={v => set(key, v)} />
        </div>
      ))}

      <div className={sectionCls}>
        <div className="flex items-center justify-between mb-4">
          <p className={sectionTitle + ' mb-0'}>Price Breakdown</p>
          <button type="button" onClick={() => setPriceBreakdown(p => [...p, { description: '', amount: '' }])} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <Plus size={14} /> Add Line
          </button>
        </div>
        <div className="space-y-2 mb-4">
          {priceBreakdown.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className={field + ' flex-1'} placeholder="Description" value={row.description} onChange={e => setPriceBreakdown(p => p.map((r, idx) => idx === i ? { ...r, description: e.target.value } : r))} />
              <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" placeholder="$0.00" value={row.amount} onChange={e => setPriceBreakdown(p => p.map((r, idx) => idx === i ? { ...r, amount: e.target.value } : r))} />
              <button type="button" onClick={() => setPriceBreakdown(p => p.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <label className={lbl + ' mb-0'}>Total Price</label>
          <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 text-right font-semibold" placeholder="$0.00" value={form.total_price} onChange={e => set('total_price', e.target.value)} />
        </div>
      </div>

      <div className={sectionCls}>
        <div className="flex items-center justify-between mb-4">
          <p className={sectionTitle + ' mb-0'}>Alternates</p>
          <button type="button" onClick={() => setAlternates(a => [...a, { description: '', amount: '' }])} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <Plus size={14} /> Add Alternate
          </button>
        </div>
        {!alternates.length ? <p className="text-slate-400 text-sm">No alternates.</p> : (
          <div className="space-y-2">
            {alternates.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className={field + ' flex-1'} placeholder="Alternate description" value={row.description} onChange={e => setAlternates(a => a.map((r, idx) => idx === i ? { ...r, description: e.target.value } : r))} />
                <input className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" placeholder="$0.00" value={row.amount} onChange={e => setAlternates(a => a.map((r, idx) => idx === i ? { ...r, amount: e.target.value } : r))} />
                <button type="button" onClick={() => setAlternates(a => a.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2 pb-8">
        <button
          type="button"
          onClick={(e) => handleSubmit(e, false)}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={() => setShowPreview(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-5 py-2 rounded-lg transition-colors">
          Preview
        </button>
        <button type="button" onClick={handleGeneratePDF} className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
          Download PDF
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={loading}
          className="text-slate-600 text-sm font-medium px-5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors ml-auto"
        >
          Done
        </button>
      </div>
    </form>
  )
}

function defaultTerms() {
  return `Payment terms: Net 30 days from invoice date.\nThis proposal is valid for 30 days from the date above.\nAll work to be performed in accordance with applicable codes and standards.\nAny changes to the scope of work shall be authorized in writing prior to commencement.\nPrice does not include permit fees unless otherwise noted.`
}
