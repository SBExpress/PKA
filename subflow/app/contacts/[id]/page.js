'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useOrganization } from '@/lib/useOrganization'
import ContactForm from '@/components/forms/ContactForm'
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'

export default function ContactDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const { org } = useOrganization()
  const [contact, setContact] = useState(null)
  const [company, setCompany] = useState(null)
  const [relatedBids, setRelatedBids] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!org) return

    async function loadContact() {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', params.id)
        .eq('organization_id', org.id)
        .single()

      if (contactData) {
        setContact(contactData)

        // Load company
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', contactData.company_id)
          .single()
        setCompany(companyData)

        // Load related bids
        const { data: bidsData } = await supabase
          .from('bid_requests')
          .select('id, project_name, status, bid_due_date')
          .eq('contact_id', contactData.id)
          .eq('organization_id', org.id)
          .order('bid_due_date', { ascending: true })
        setRelatedBids(bidsData || [])
      }

      setLoading(false)
    }

    loadContact()
  }, [org, params.id, supabase])

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8"><p className="text-slate-400">Loading...</p></div>
  }

  if (!contact) {
    return <div className="min-h-screen bg-slate-50 p-8"><p className="text-slate-400">Contact not found</p></div>
  }

  const statusColor = {
    received: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    submitted: 'bg-purple-100 text-purple-700',
    declined: 'bg-slate-100 text-slate-600',
    awarded: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={18} /></button>
          <div><h1 className="text-3xl font-bold text-slate-800">{contact.name}</h1>{contact.title && <p className="text-slate-600">{contact.title}</p>}</div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Contact Information</h2>
              <div className="space-y-3">
                {contact.email && <div className="flex items-center gap-3"><Mail size={16} className="text-slate-400" /><a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a></div>}
                {contact.phone && <div className="flex items-center gap-3"><Phone size={16} className="text-slate-400" /><a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">{contact.phone}</a></div>}
                {contact.cellphone && <div className="flex items-center gap-3"><Phone size={16} className="text-slate-400" /><a href={`tel:${contact.cellphone}`} className="text-blue-600 hover:underline">{contact.cellphone} (Cell)</a></div>}
                {contact.address && <div className="flex items-start gap-3"><MapPin size={16} className="text-slate-400 mt-0.5" /><p className="text-slate-600">{contact.address}</p></div>}
              </div>
              {contact.notes && <div className="mt-6 pt-6 border-t border-slate-200"><h3 className="font-medium text-slate-700 mb-2">Notes</h3><p className="text-slate-600 text-sm whitespace-pre-wrap">{contact.notes}</p></div>}
            </div>

            {company && <div className="bg-white rounded-xl shadow-sm p-6"><h2 className="text-lg font-semibold text-slate-800 mb-4">Company</h2><Link href={`/companies/${company.id}`} className="text-blue-600 hover:text-blue-700 font-medium text-lg">{company.name} →</Link></div>}

            {relatedBids.length > 0 && <div className="bg-white rounded-xl shadow-sm p-6"><h2 className="text-lg font-semibold text-slate-800 mb-4">Related Bid Requests</h2><div className="space-y-2">{relatedBids.map(bid => <Link key={bid.id} href={`/bids/${bid.id}`} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group"><div className="flex-1"><p className="font-medium text-slate-800 group-hover:text-blue-600">{bid.project_name}</p>{bid.bid_due_date && <p className="text-xs text-slate-500">Due: {new Date(bid.bid_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}</div><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[bid.status] || 'bg-slate-100 text-slate-600'}`}>{bid.status.replace('_', ' ')}</span></Link>)}</div></div>}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6"><h2 className="text-lg font-semibold text-slate-800 mb-4">Edit Contact</h2><ContactForm contact={contact} onSaved={() => router.push('/contacts')} /></div>
        </div>
      </div>
    </div>
  )
}
