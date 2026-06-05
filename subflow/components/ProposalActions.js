'use client'

import { useState } from 'react'
import { Eye, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { generateProposalPDF } from '@/lib/generatePDF'
import ProposalPreview from '@/components/ProposalPreview'

export default function ProposalActions({ proposal, bid, customer, contact, settings }) {
  const supabase = createClient()
  const [preview, setPreview] = useState(null)

  async function loadFull() {
    const { data } = await supabase.from('proposals').select('*').eq('id', proposal.id).single()
    return data
  }

  async function loadContactAndCustomer() {
    let contactData = contact
    let customerData = customer

    // Fetch fresh contact data if proposal has contact_id
    if (proposal.contact_id) {
      const { data } = await supabase.from('contacts').select('*').eq('id', proposal.contact_id).single()
      if (data) contactData = data
    }

    // Fetch fresh company data if bid has customer_id
    if (bid?.customer_id) {
      const { data } = await supabase.from('companies').select('*').eq('id', bid.customer_id).single()
      if (data) customerData = data
    }

    return { contactData, customerData }
  }

  async function handlePreview() {
    const full = await loadFull()
    const { contactData, customerData } = await loadContactAndCustomer()
    if (full) setPreview({ ...full, bid, contact: contactData, customer: customerData, settings })
  }

  async function handleDownload() {
    const full = await loadFull()
    const { contactData, customerData } = await loadContactAndCustomer()
    if (full) await generateProposalPDF({ ...full, bid, contact: contactData, customer: customerData, settings })
  }

  return (
    <>
      {preview && <ProposalPreview data={preview} onClose={() => setPreview(null)} />}
      <button
        onClick={handlePreview}
        className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 rounded hover:bg-blue-50"
        title="Preview"
      >
        <Eye size={15} />
      </button>
      <button
        onClick={handleDownload}
        className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded hover:bg-slate-100"
        title="Download PDF"
      >
        <Download size={15} />
      </button>
    </>
  )
}
