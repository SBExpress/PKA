'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useOrganization } from '@/lib/useOrganization'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import RichSectionEditor from '@/components/RichSectionEditor'
import RFIPreview from '@/components/RFIPreview'
import CompanySelector from '@/components/CompanySelector'
import { generateRFIPDF } from '@/lib/generatePDF'
import { ArrowLeft, Eye, Download, Plus } from 'lucide-react'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'block text-sm font-medium text-slate-700 mb-1'

const statusColor = {
  open: 'bg-yellow-100 text-yellow-700',
  answered: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-500',
}

const emptyForm = {
  header: '',
  company_id: null,
  sent_to_name: '',
  sent_to_contact_id: null,
  sent_to_contact: '',
  sent_to_email: '',
  question: '',
  response: '',
  status: 'open',
}

export default function RFIPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const rfiId = searchParams.get('id')
  const supabase = createClient()
  const { org } = useOrganization()

  const [bid, setBid] = useState(null)
  const [settings, setSettings] = useState(null)
  const [contacts, setContacts] = useState([])
  const [rfis, setRfis] = useState([])
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
      const [{ data: bidData }, { data: settingsData }, { data: rfiList }, { data: contactList }, { data: proposals }] = await Promise.all([
        supabase.from('bid_requests').select('*, companies:customer_id(*)').eq('id', id).single(),
        supabase.from('settings').select('*').eq('organization_id', org.id).single(),
        supabase.from('rfis').select('*').eq('bid_request_id', id).order('created_at', { ascending: false }),
        supabase.from('contacts').select('*').eq('organization_id', org.id).order('name'),
        supabase.from('proposals').select('contact_id').eq('bid_request_id', id).order('revision', { ascending: false }).limit(1),
      ])
      if (bidData) {
        setBid(bidData)
        // Prefill new RFI form with customer and contact info from bid/proposal
        if (!rfiId && !editingId) {
          let contactToUse = null
          let contactIdToUse = null

          // Try to get contact from latest proposal
          if (proposals && proposals.length > 0 && proposals[0].contact_id) {
            const { data: contactData } = await supabase.from('contacts').select('*').eq('id', proposals[0].contact_id).single()
            if (contactData) {
              contactToUse = contactData
              contactIdToUse = contactData.id
            }
          }

          // Fallback to bid's contact_id
          if (!contactToUse && bidData.contact_id) {
            const { data: contactData } = await supabase.from('contacts').select('*').eq('id', bidData.contact_id).single()
            if (contactData) {
              contactToUse = contactData
              contactIdToUse = contactData.id
            }
          }

          setForm(f => ({
            ...emptyForm,
            sent_to_name: bidData.companies?.name || bidData.customer_company || '',
            sent_to_contact_id: contactIdToUse,
            sent_to_contact: contactToUse?.name || '',
            sent_to_email: contactToUse?.email || bidData.customer_email || '',
          }))
        }
      }
      if (settingsData) setSettings(settingsData)
      if (contactList) setContacts(contactList)
      const list = rfiList || []
      setRfis(list)

      if (rfiId) {
        const found = list.find(r => r.id === rfiId)
        if (found) applyRFI(found, found.id)
      }
    }
    load()
  }, [id, org])

  function applyRFI(rfi, newEditingId) {
    setEditingId(newEditingId)
    setForm({
      header: rfi.header || '',
      company_id: rfi.company_id || null,
      sent_to_name: rfi.sent_to_name || '',
      sent_to_contact_id: rfi.sent_to_contact_id || null,
      sent_to_contact: rfi.sent_to_contact || '',
      sent_to_email: rfi.sent_to_email || '',
      question: rfi.question || '',
      response: rfi.response || '',
      status: rfi.status || 'open',
    })
  }

  function selectRFI(rfi) {
    applyRFI(rfi, rfi.id)
    router.push(`/bids/${id}/rfi?id=${rfi.id}`, { scroll: false })
  }

  function newForm() {
    setEditingId(null)
    // Prefill from bid customer if available
    if (bid) {
      setForm(f => ({
        ...emptyForm,
        sent_to_name: bid.customer_company || bid.customer_name || '',
        sent_to_contact: bid.customer_name || '',
        sent_to_email: bid.customer_email || '',
      }))
    } else {
      setForm(emptyForm)
    }
    router.push(`/bids/${id}/rfi`, { scroll: false })
  }

  function handleSelectCompany(company) {
    setForm(f => ({
      ...f,
      company_id: company.id,
      sent_to_name: company.name,
      sent_to_contact: '',
      sent_to_contact_id: null,
      sent_to_email: company.email || '',
    }))
  }

  function handleCompanyCreated(company) {
    handleSelectCompany(company)
  }

  function handleSelectContact(contact) {
    setForm(f => ({
      ...f,
      sent_to_contact_id: contact.id,
      sent_to_contact: contact.name || '',
      sent_to_email: contact.email || f.sent_to_email,
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
      sent_to_name: form.sent_to_name,
      sent_to_contact_id: form.sent_to_contact_id || null,
      sent_to_contact: form.sent_to_contact,
      sent_to_email: form.sent_to_email,
      question: form.question,
      response: form.response,
      status: form.status,
      bid_request_id: id,
      user_id: user.id,
      organization_id: org.id,
      updated_at: new Date().toISOString(),
    }
    if (editingId) {
      const { error: err } = await supabase.from('rfis').update(payload).eq('id', editingId)
      if (err) { setError(err.message); setLoading(false); return }
      setRfis(r => r.map(x => x.id === editingId ? { ...x, ...payload, id: editingId } : x))
    } else {
      const { data, error: err } = await supabase.from('rfis').insert(payload).select().single()
      if (err) { setError(err.message); setLoading(false); return }
      setRfis(r => [data, ...r])
      setEditingId(data.id)
      router.push(`/bids/${id}/rfi?id=${data.id}`, { scroll: false })
    }
    setLoading(false)
  }

  async function handlePDF() {
    if (bid) await generateRFIPDF({ bid, rfi: form, settings })
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
            <h1 className="text-2xl font-bold text-slate-800">{editingId ? 'Edit RFI' : 'New RFI'}</h1>
            {bid && <p className="text-sm text-slate-500 mt-0.5">{bid.project_name}</p>}
          </div>
          <button
            type="button"
            onClick={newForm}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Plus size={14} /> New RFI
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
                  filterType="customer"
                  selectedCompanyId={form.company_id}
                  onSelectCompany={handleSelectCompany}
                  onCompanyCreated={handleCompanyCreated}
                  label="Select Customer Company"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={lbl}>Send To (Company / Name)</label>
                  <input className={field} value={form.sent_to_name} onChange={e => setForm(f => ({ ...f, sent_to_name: e.target.value }))} placeholder="Company or person name" />
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
                  <select className={field} value={form.sent_to_contact_id || ''} onChange={e => {
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

              <div className="mb-4">
                <label className={lbl}>Email</label>
                <input type="email" className={field} value={form.sent_to_email} onChange={e => setForm(f => ({ ...f, sent_to_email: e.target.value }))} placeholder="email@example.com" />
              </div>

              <div className="mb-4">
                <label className={lbl}>Information Requested</label>
                <RichSectionEditor
                  sectionKey="rfi_question"
                  value={form.question}
                  onChange={v => setForm(f => ({ ...f, question: v }))}
                />
              </div>

              <div className="mb-4">
                <label className={lbl}>Response</label>
                <RichSectionEditor
                  sectionKey="rfi_response"
                  value={form.response}
                  onChange={v => setForm(f => ({ ...f, response: v }))}
                />
              </div>

              <div className="mb-6">
                <label className={lbl}>Status</label>
                <select className={field} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="open">Open</option>
                  <option value="answered">Answered</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60">
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
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
              <h2 className="font-semibold text-slate-700 text-sm">RFIs for this Bid</h2>
              <span className="text-xs text-slate-400">{rfis.length}</span>
            </div>
            {!rfis.length ? (
              <p className="px-4 py-4 text-xs text-slate-400">No RFIs yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {rfis.map(r => (
                  <li
                    key={r.id}
                    className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${r.id === editingId ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    onClick={() => selectRFI(r)}
                  >
                    <p className="text-sm font-medium text-slate-700 truncate">{r.header || 'No header'}</p>
                    {r.sent_to_name && <p className="text-xs text-slate-500 truncate mt-0.5">{r.sent_to_name}</p>}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[r.status] || 'bg-slate-100 text-slate-500'}`}>{r.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {showPreview && bid && (
          <RFIPreview data={{ bid, rfi: form, settings }} onClose={() => setShowPreview(false)} />
        )}
      </main>
    </div>
  )
}
