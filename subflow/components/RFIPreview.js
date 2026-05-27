'use client'

import { X } from 'lucide-react'

function isEmpty(content) {
  if (!content) return true
  return content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() === ''
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function RFIPreview({ data, onClose }) {
  const { bid, rfi, settings } = data
  const bizName = settings?.business_name || ''
  const bizAddr = settings ? [settings.business_address, settings.business_city, settings.business_state, settings.business_zip].filter(Boolean).join(', ') : ''
  const bizContact = settings ? [settings.business_phone, settings.business_email].filter(Boolean).join('   ') : ''
  const navy = '#1a2744'
  const red = '#dc2626'
  const today = new Date().toISOString().slice(0, 10)

  const SectionBar = ({ title }) => (
    <div className="px-3 py-1.5 mb-2" style={{ backgroundColor: '#f8fafc' }}>
      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: navy }}>{title}</span>
    </div>
  )

  const renderContent = (html) => (
    <div
      className="text-sm text-slate-700 tiptap-content px-3"
      dangerouslySetInnerHTML={{ __html: html?.includes('<') ? html : html?.replace(/\n/g, '<br>') || '' }}
    />
  )

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
          {/* Header */}
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
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-slate-900 tracking-wide">REQUEST FOR INFORMATION</h1>
              <div className="mx-auto mt-1.5 w-36 border-b-2" style={{ borderColor: red }} />
            </div>

            {rfi.header && (
              <div className="text-center mb-5">
                <p className="text-base font-semibold text-slate-800">{rfi.header}</p>
              </div>
            )}

            <div className="mb-5 text-sm text-slate-700">
              {rfi.sent_to_name && (
                <div className="mb-0.5">
                  <span className="font-medium">To:   </span>
                  <span className="font-semibold">{rfi.sent_to_name}</span>
                </div>
              )}
              {rfi.sent_to_contact && (
                <div className="mt-0.5">
                  <span className="font-medium">Attn: </span>
                  <span className="font-semibold">{rfi.sent_to_contact}</span>
                </div>
              )}
              {rfi.sent_to_email && <div className="ml-10 text-slate-500">{rfi.sent_to_email}</div>}
            </div>

            <div className="mb-4 text-sm text-slate-700">
              <div className="font-bold">Project:  {bid?.project_name}</div>
            </div>

            <div className="flex justify-end text-xs text-slate-500 mb-4">
              <span>Date: {formatDate(today)}</span>
            </div>

            <div className="border-b border-slate-200 mb-6" />

            {!isEmpty(rfi.question) && (
              <div className="mb-5">
                <SectionBar title="Information Requested" />
                {renderContent(rfi.question)}
              </div>
            )}

            {!isEmpty(rfi.response) && (
              <div className="mb-5">
                <SectionBar title="Response" />
                {renderContent(rfi.response)}
              </div>
            )}
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
