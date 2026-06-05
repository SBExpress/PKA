'use client'

import { X } from 'lucide-react'

function isEmpty(content) {
  if (!content) return true
  return content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() === ''
}

function formatMoney(val) {
  const n = parseFloat(val)
  return isNaN(n) ? '' : '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 })
}

export default function ProposalPreview({ data, onClose }) {
  const { bid, contact, customer, settings, revision, date, total_price,
    description, drawings_used, detailed_description, clarifications,
    work_not_included, terms, price_breakdown, alternates } = data

  const bizName = settings?.business_name || ''
  const bizAddr = settings ? [settings.business_address, settings.business_city, settings.business_state, settings.business_zip].filter(Boolean).join(', ') : ''
  const bizContact = settings ? [settings.business_phone, settings.business_email].filter(Boolean).join('   ') : ''
  const projectAddr = bid ? [bid.project_address, bid.city, bid.state, bid.zip].filter(Boolean).join(', ') : ''
  const customerAddr = customer ? [customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(', ') : ''
  const contactName = contact ? (contact.name || [contact.first_name, contact.last_name].filter(Boolean).join(' ')) : ''
  const formattedDate = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''
  const navy = '#1a2744'
  const red = '#dc2626'

  const hasBreakdown = price_breakdown?.some(r => r.description)
  const hasAlternates = alternates?.some(r => r.description)

  const SectionBar = ({ title }) => (
    <div className="px-3 py-1.5 mb-2" style={{ backgroundColor: '#f8fafc' }}>
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: navy }}>{title}</span>
    </div>
  )

  const textSections = [
    { title: 'Description', content: description },
    { title: 'Drawings Referenced', content: drawings_used },
    { title: 'Scope of Work', content: detailed_description },
    { title: 'Clarifications', content: clarifications },
    { title: 'Work Not Included', content: work_not_included },
  ]

  const termsIsHtml = terms?.includes('<')

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="relative w-full max-w-[816px]">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white rounded-full shadow-lg p-1.5 z-10 hover:bg-slate-50 transition-colors"
        >
          <X size={16} className="text-slate-600" />
        </button>

        <div className="bg-white shadow-2xl">
          {/* Header — white with logo left, company right, red line */}
          <div className="flex items-start justify-between px-[54px] py-3 bg-white">
            <div className="min-w-0">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="h-10 object-contain" />
              ) : (
                <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400">Logo</div>
              )}
            </div>
            <div className="text-right">
              {bizName && <div className="font-bold text-sm text-slate-900">{bizName}</div>}
              {bizAddr && <div className="text-xs text-slate-500 mt-0.5">{bizAddr}</div>}
              {bizContact && <div className="text-xs text-slate-500 mt-0.5">{bizContact}</div>}
            </div>
          </div>
          <div className="mx-[54px] border-b-2" style={{ borderColor: red }} />

          {/* Content */}
          <div className="px-[54px] pt-8 pb-4">

            {/* PROPOSAL title */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-slate-900 tracking-wide">PROPOSAL</h1>
              <div className="mx-auto mt-1.5 w-24 border-b-2" style={{ borderColor: red }} />
            </div>

            {/* To / Attn / Project block */}
            <div className="mb-6 text-sm text-slate-700">
              {(customer?.company_name || bid?.customer_company) && (
                <div className="mb-0.5">
                  <span className="font-medium">To:   </span>
                  {customer?.company_name || bid?.customer_company}
                </div>
              )}
              {customerAddr && <div className="ml-10 text-slate-500">{customerAddr}</div>}
              {contactName && (
                <div className="mt-0.5">
                  <span className="font-medium">Attn: </span>
                  {contactName}{contact?.title ? `, ${contact.title}` : ''}
                </div>
              )}
              {contact?.phone && <div className="ml-10 text-slate-500">Phone: {contact.phone}</div>}
              {contact?.cellphone && <div className="ml-10 text-slate-500">Cell: {contact.cellphone}</div>}
              {contact?.email && <div className="ml-10 text-slate-500">Email: {contact.email}</div>}
            </div>

            <div className="mb-4 text-sm text-slate-700">
              <div className="font-bold">
                Project:  {bid?.project_name}
              </div>
              {projectAddr && <div className="ml-16 text-slate-500">{projectAddr}</div>}
            </div>

            <div className="flex justify-end gap-8 text-xs text-slate-500 mb-4">
              {formattedDate && <span>Date: {formattedDate}</span>}
              {revision !== undefined && revision !== null && <span>Revision: {revision}</span>}
            </div>

            <div className="border-b border-slate-200 mb-6" />

            {/* Text sections */}
            {textSections.map(({ title, content }) => {
              if (isEmpty(content)) return null
              return (
                <div key={title} className="mb-5">
                  <SectionBar title={title} />
                  <div className="text-sm text-slate-700 tiptap-content px-3" dangerouslySetInnerHTML={{ __html: content?.includes('<') ? content : content?.replace(/\n/g, '<br>') || '' }} />
                </div>
              )
            })}

            {/* Price Breakdown */}
            {(hasBreakdown || total_price) && (
              <div className="mb-5">
                {hasBreakdown && (
                  <>
                    <SectionBar title="Price Breakdown" />
                    <table className="w-full text-sm mb-3">
                      <thead>
                        <tr style={{ backgroundColor: navy }}>
                          <th className="text-left py-2 px-3 text-white text-xs font-semibold">Description</th>
                          <th className="text-right py-2 px-3 text-white text-xs font-semibold w-32">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {price_breakdown.filter(r => r.description).map((r, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="py-2 px-3 text-slate-700">{r.description}</td>
                            <td className="py-2 px-3 text-right text-slate-700">{formatMoney(r.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                {total_price && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 px-1">
                    <span className="font-bold text-sm" style={{ color: navy }}>Total Price:</span>
                    <span className="font-bold text-sm" style={{ color: navy }}>{formatMoney(total_price)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Alternates */}
            {hasAlternates && (
              <div className="mb-5">
                <SectionBar title="Alternates" />
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: navy }}>
                      <th className="text-left py-2 px-3 text-white text-xs font-semibold">Alternate Description</th>
                      <th className="text-right py-2 px-3 text-white text-xs font-semibold w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alternates.filter(r => r.description).map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="py-2 px-3 text-slate-700">{r.description}</td>
                        <td className="py-2 px-3 text-right text-slate-700">{formatMoney(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Terms */}
            {!isEmpty(terms) && (
              <div className="mb-5">
                <SectionBar title="Terms and Conditions" />
                {termsIsHtml ? (
                  <div className="text-sm text-slate-700 tiptap-content px-3" dangerouslySetInnerHTML={{ __html: terms }} />
                ) : (
                  <div className="text-sm text-slate-700 px-3 whitespace-pre-wrap">{terms}</div>
                )}
              </div>
            )}

            {/* Signature block */}
            <div className="mt-8 pt-5 border-t-2 border-slate-800">
              <div className="text-sm font-bold text-slate-800 mb-3">AUTHORIZATION AND ACCEPTANCE</div>
              <div className="text-sm text-slate-700 mb-6">
                By signing below, the authorized representative agrees to the terms, price, and scope of work outlined in this proposal.
                <br /><br />
                Project: {bid?.project_name}<br />
                Proposal Date: {formattedDate}{revision !== undefined && revision !== null ? `   Revision: ${revision}` : ''}
                {total_price ? <><br />Total Price: {formatMoney(total_price)}</> : ''}
              </div>
              <div className="grid grid-cols-2 gap-10 mb-8">
                <div>
                  <div className="border-b border-slate-400 mb-1.5 h-9" />
                  <p className="text-xs text-slate-500">Authorized Signature</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 mb-1.5 h-9" />
                  <p className="text-xs text-slate-500">Printed Name</p>
                </div>
              </div>
              <div className="w-40">
                <div className="border-b border-slate-400 mb-1.5 h-9" />
                <p className="text-xs text-slate-500">Date</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-[54px] py-2.5 flex justify-between items-center border-t border-slate-100">
            <span className="text-xs text-slate-400">Page 1</span>
            <span className="text-xs text-slate-400">CONFIDENTIAL</span>
            <span className="text-xs text-slate-400">Initials: ______</span>
          </div>
        </div>
      </div>
    </div>
  )
}
