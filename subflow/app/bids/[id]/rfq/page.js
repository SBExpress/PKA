'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useOrganization } from '@/lib/useOrganization'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import RichSectionEditor from '@/components/RichSectionEditor'
import RFQPreview from '@/components/RFQPreview'
import CompanySelector from '@/components/CompanySelector'
import { generateRFQPDF } from '@/lib/generatePDF'
import { ArrowLeft, Eye, Download, Plus, Copy } from 'lucide-react'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'block text-sm font-medium text-slate-700 mb-1'

const statusColor = {
  draft: 'bg-slate-100 text-slate-500',
  sent: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
}

const emptyForm = {
  header: '',
  company_id: null,
  vendor_name: '',
  vendor_contact_id: null,
  vendor_contact: '',
  vendor_email: '',
  due_date: '',
  quoted_amount: '',
  content: '',
  status: 'draft',
}

export default function RFQPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const rfqId = searchParams.get('id')
  const copyId = searchParams.get('copy')
  const supabase = createClient()
  const { org } = useOrganization()

  const [bid, setBid] = useState(null)
  const [settings, setSettings] = useState(null)
  const [contacts, setContacts] = useState([])
  const [rfqs, setRfqs] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showNewContact, setShowNewContact] = useState(false)
  const [newContactFirst, setNewContactFirst] = useState('')
  const [newContactLast, setNewContactLast] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')

  useEffect(() => {
    async function load() {
      if (!org) return
      const { data: { user } } = await supabase.auth.getUser()
      const [{ data: bidData }, { data: settingsData }, { data: rfqList }, { data: contactList }] = await Promise.all([
        supabase.from('bid_requests').select('*, customers(*)').eq('id', id).single(),
        supabase.from('settings').select('*').eq('organization_id', org.id).single(),
        supabase.from('rfqs').select('*').eq('bid_request_id', id).order('created_at', { ascending: false }),
        supabase.from('contacts').select('*').eq('organization_id', org.id).order('name'),
      ])
      if (bidData) setBid(bidData)
      if (settingsData) setSettings(settingsData)
      if (contactList) setContacts(contactList)
      const list = rfqList || []
      setRfqs(list)

      if (rfqId) {
        const found = list.find(r => r.id === rfqId)
        if (found) applyRFQ(found, found.id)
      } else if (copyId) {
        const found = list.find(r => r.id === copyId)
        if (found) applyRFQ({ ...found, quoted_amount: '' }, null)
      }
    }
    load()
  }, [id, org])

  function applyRFQ(rfq, newEditingId) {
    setEditingId(newEditingId)
    setForm({
      header: rfq.header || '',
      company_id: rfq.company_id || null,
      vendor_name: rfq.vendor_name || '',
      vendor_contact_id: rfq.vendor_contact_id || null,
      vendor_contact: rfq.vendor_contact || '',
      vendor_email: rfq.vendor_email || '',
      due_date: rfq.due_date || '',
      quoted_amount: rfq.quoted_amount != null ? String(rfq.quoted_amount) : '',
      content: rfq.content || '',
      status: rfq.status || 'draft',
    })
  }

  function selectRFQ(rfq) {
    applyRFQ(rfq, rfq.id)
    router.push(`/bids/${id}/rfq?id=${rfq.id}`, { scroll: false })
  }

  function newForm() {
    setEditingId(null)
    setForm(emptyForm)
    router.push(`/bids/${id}/rfq`, { scroll: false })
  }

  function handleSelectCompany(company) {
    setForm(f => ({
      ...f,
      company_id: company.id,
      vendor_name: company.name,
      vendor_contact: '',
      vendor_contact_id: null,
      vendor_email: company.email || '',
    }))
  }

  function handleCompanyCreated(company) {
    handleSelectCompany(company)
  }

  function handleSelectContact(contact) {
    setForm(f => ({
      ...f,
      vendor_contact_id: contact.id,
      vendor_contact: contact.name || '',
      vendor_email: contact.email || f.vendor_email,
    }))
  }

  async function addContactInline() {
    if (!newContactFirst.trim() || !org) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('contacts').insert({
      name: [newContactFirst.trim(), newContactLast.trim()].filter(Boolean).join(' '),
      email: newContactEmail.trim() || null,
      phone: newContactPhone.trim() || null,
      organization_id: org.id,
      user_id: user.id,
    }).select().single()
    if (data) {
      setContacts(c => [...c, data].sort((a, b) => (a.name || '').localeCompare(b.name || '')))
      handleSelectContact(data)
      setNewContactFirst('')
      setNewContactLast('')
      setNewContactEmail('')
      setNewContactPhone('')
      setShowNewContact(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!org) return
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      header: form.header,
      company_id: form.company_id || null,
      vendor_name: form.vendor_name,
      vendor_contact_id: form.vendor_contact_id || null,
      vendor_contact: form.vendor_contact,
      vendor_email: form.vendor_email,
      due_date: form.due_date || null,
      quoted_amount: form.quoted_amount ? parseFloat(form.quoted_amount) : null,
      content: form.content,
      status: form.status,
      bid_request_id: id,
      user_id: user.id,
      organization_id: org.id,
      updated_at: new Date().toISOString(),
    }
    if (editingId) {
      const { error: err } = await supabase.from('rfqs').update(payload).eq('id', editingId)
      if (err) { setError(err.message); setLoading(false); return }
      setRfqs(r => r.map(x => x.id === editingId ? { ...x, ...payload, id: editingId } : x))
    } else {
      const { data, error: err } = await supabase.from('rfqs').insert(payload).select().single()
      if (err) { setError(err.message); setLoading(false); return }
      setRfqs(r => [data, ...r])
      setEditingId(data.id)
      router.push(`/bids/${id}/rfq?id=${data.id}`, { scroll: false })
    }
    setLoading(false)
  }

  async function handlePDF() {
    console.log('handlePDF called, bid:', bid, 'form:', form, 'settings:', settings)
    try {
      if (bid) {
        console.log('Generating PDF...')
        await generateRFQPDF({ bid, rfq: form, settings })
        console.log('PDF generated successfully')
      } else {
        console.log('bid is not available')
        setError('Bid data not loaded yet')
      }
    } catch (err) {
      console.error('PDF generation error:', err)
      setError('Failed to generate PDF: ' + (err.message || 'Unknown error'))
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/bids/${id}`} className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">{editingId ? 'Edit RFQ' : 'New RFQ'}</h1>
            {bid && <p className="text-sm text-slate-500 mt-0.5">{bid.project_name}</p>}
          </div>
          <button
            type="button"
            onClick={newForm}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Plus size={14} /> New RFQ
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}

              <div className="mb-4">
                <label className={lbl}>Header / Description</label>
                <input
                  className={field}
                  value={form.header}
                  onChange={e => setForm(f => ({ ...f, header: e.target.value }))}
                  placeholder="General description shown on the bid page and at the top of the document"
                />
              </div>

              <div className="mb-4">
                <CompanySelector
                  filterType="vendor"
                  selectedCompanyId={form.company_id}
                  onSelectCompany={handleSelectCompany}
                  onCompanyCreated={handleCompanyCreated}
                  label="Select Vendor Company"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={lbl}>Vendor / Company</label>
                  <input className={field} value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} placeholder="Vendor company name" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={lbl + ' mb-0'}>Contact Name</label>
                    <button type="button" onClick={() => setShowNewContact(!showNewContact)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <Plus size={12} /> New
                    </button>
                  </div>
                  {showNewContact && (
                    <div className="space-y-2 mb-2 p-2 bg-slate-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-2">
                        <input className={field} placeholder="First name" value={newContactFirst} onChange={e => setNewContactFirst(e.target.value)} />
                        <input className={field} placeholder="Last name" value={newContactLast} onChange={e => setNewContactLast(e.target.value)} />
                      </div>
                      <input className={field} placeholder="Email" value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} />
                      <button type="button" onClick={addContactInline} className="bg-blue-600 text-white text-xs px-2 py-1 rounded-lg w-full">Add</button>
                    </div>
                  )}
                  <select className={field} value={form.vendor_contact_id || ''} onChange={e => {
                    const contactId = e.target.value
                    if (contactId) {
                      const contact = contacts.find(c => c.id === contactId)
                      if (contact) handleSelectContact(contact)
                    }
                  }}>
                    <option value="">Select a contact...</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={lbl}>Vendor Email</label>
                  <input type="email" className={field} value={form.vendor_email} onChange={e => setForm(f => ({ ...f, vendor_email: e.target.value }))} placeholder="vendor@example.com" />
                </div>
                <div>
                  <label className={lbl}>Quote Due Date</label>
                  <input type="date" className={field} value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>

              <div className="mb-4">
                <label className={lbl}>Scope / Description</label>
                <RichSectionEditor
                  sectionKey="rfq_content"
                  value={form.content}
                  onChange={v => setForm(f => ({ ...f, content: v }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className={lbl}>Quoted Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={field}
                    value={form.quoted_amount}
                    onChange={e => setForm(f => ({ ...f, quoted_amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={lbl}>Status</label>
                  <select className={field} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="received">Received</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60">
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('Preview button clicked')
                    setShowPreview(true)
                  }}
                  className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Eye size={14} /> Preview
                </button>
                <button
                  type="button"
                  onClick={handlePDF}
                  className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Download size={14} /> PDF
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Duplicate button clicked, editingId:', editingId)
                      router.push(`/bids/${id}/rfq?copy=${editingId}`, { scroll: false })
                    }}
                    className="flex items-center gap-1.5 text-sm text-slate-500 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Copy size={14} /> Duplicate
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => router.push(`/bids/${id}`)}
                  className="text-slate-600 text-sm font-medium px-5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors ml-auto"
                >
                  Done
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm h-fit">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-700 text-sm">RFQs for this Bid</h2>
              <span className="text-xs text-slate-400">{rfqs.length}</span>
            </div>
            {!rfqs.length ? (
              <p className="px-4 py-4 text-xs text-slate-400">No RFQs yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rfqs.map(r => (
                  <li
                    key={r.id}
                    className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${r.id === editingId ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    onClick={() => selectRFQ(r)}
                  >
                    <p className="text-sm font-medium text-slate-700 truncate">{r.header || 'No header'}</p>
                    {r.vendor_name && <p className="text-xs text-slate-500 truncate mt-0.5">{r.vendor_name}</p>}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[r.status] || 'bg-slate-100 text-slate-500'}`}>{r.status}</span>
                    </div>
                    {r.quoted_amount && (
                      <p className="text-xs text-green-700 font-medium mt-0.5">${Number(r.quoted_amount).toLocaleString()}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {showPreview && bid && (
          <RFQPreview data={{ bid, rfq: form, settings }} onClose={() => setShowPreview(false)} />
        )}
      </main>
    </div>
  )
}
