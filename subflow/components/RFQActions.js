'use client'

import { useState } from 'react'
import { Eye, Download } from 'lucide-react'
import RFQPreview from './RFQPreview'
import { generateRFQPDF } from '@/lib/generatePDF'

export default function RFQActions({ rfq, bid, settings }) {
  const [showPreview, setShowPreview] = useState(false)

  async function handleDownload() {
    await generateRFQPDF({ bid, rfq, settings })
  }

  return (
    <>
      <button
        onClick={() => setShowPreview(true)}
        title="Preview"
        className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 rounded hover:bg-blue-50"
      >
        <Eye size={15} />
      </button>
      <button
        onClick={handleDownload}
        title="Download PDF"
        className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded hover:bg-slate-100"
      >
        <Download size={15} />
      </button>
      {showPreview && (
        <RFQPreview data={{ bid, rfq, settings }} onClose={() => setShowPreview(false)} />
      )}
    </>
  )
}
