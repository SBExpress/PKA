import jsPDF from 'jspdf'
import 'jspdf-autotable'

async function loadImage(url) {
  if (!url) return null
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const base64 = canvas.toDataURL('image/png')
    return { data: base64, format: 'PNG', w: img.naturalWidth, h: img.naturalHeight }
  } catch {
    return null
  }
}

// Parse HTML to structured lines for proper PDF rendering with indentation
function parseToLines(html) {
  if (!html?.trim()) return []
  try {
    const parser = new DOMParser()
    const dom = parser.parseFromString(`<body>${html}</body>`, 'text/html')
    const lines = []

    function getDirectText(node) {
      let t = ''
      for (const child of node.childNodes) {
        if (child.nodeType === 3) t += child.textContent
        else if (child.nodeType === 1 && !['ol', 'ul'].includes(child.tagName.toLowerCase())) t += getDirectText(child)
      }
      return t
    }

    function walkList(listNode, depth) {
      const isBullet = listNode.tagName.toLowerCase() === 'ul'
      const ALPHA = 'abcdefghijklmnopqrstuvwxyz'
      let n = 0
      for (const child of listNode.childNodes) {
        if (child.nodeType !== 1 || child.tagName.toLowerCase() !== 'li') continue
        n++
        const text = getDirectText(child).trim()
        const prefix = isBullet ? '•' : (depth === 0 ? `${n}.` : `${ALPHA[(n - 1) % 26]}.`)
        if (text) lines.push({ text, prefix, depth: depth + 1 })
        for (const cc of child.childNodes) {
          if (cc.nodeType === 1 && ['ol', 'ul'].includes(cc.tagName.toLowerCase())) {
            walkList(cc, depth + 1)
          }
        }
      }
    }

    function walk(node, depth) {
      if (node.nodeType !== 1) return
      const tag = node.tagName.toLowerCase()
      if (['p', 'h1', 'h2', 'h3', 'h4'].includes(tag)) {
        const text = getDirectText(node).trim()
        if (text) lines.push({ text, prefix: '', depth })
      } else if (tag === 'ul' || tag === 'ol') {
        walkList(node, depth)
      } else {
        for (const c of node.childNodes) walk(c, depth)
      }
    }

    for (const c of dom.body.childNodes) walk(c, 0)
    return lines
  } catch {
    const text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
    return text ? [{ text, prefix: '', depth: 0 }] : []
  }
}

// Plain-text strip for signature page
function stripHtml(html) {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatMoney(val) {
  const n = parseFloat(val)
  if (isNaN(n)) return ''
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 })
}

function buildDoc(settings) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 54
  const contentW = pageW - margin * 2
  const red = [220, 38, 38]
  const navy = [26, 39, 68]
  const lightGray = [248, 250, 252]
  const topPad = 24
  const bottomPad = 42
  const footerH = 26
  const headerH = 58
  const contentTop = topPad + headerH + 14
  const contentBottom = pageH - footerH - bottomPad - 8
  const totalPagesExp = '{total_pages_count_string}'

  const bizName = settings?.business_name || ''
  const bizAddr = settings ? [settings.business_address, settings.business_city, settings.business_state, settings.business_zip].filter(Boolean).join(', ') : ''
  const bizContactStr = settings ? [settings.business_phone, settings.business_email].filter(Boolean).join('   ') : ''

  let pageNum = 0

  function addHeader(logo) {
    pageNum++
    if (logo) {
      const maxH = 40
      const maxW = 110
      const lh = maxH
      const lw = Math.min(maxW, lh * (logo.w / logo.h))
      try { doc.addImage(logo.data, logo.format, margin, topPad + 4, lw, lh) } catch {}
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    if (bizName) doc.text(bizName, pageW - margin, topPad + 18, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(80, 80, 80)
    if (bizAddr) doc.text(bizAddr, pageW - margin, topPad + 30, { align: 'right' })
    if (bizContactStr) doc.text(bizContactStr, pageW - margin, topPad + 41, { align: 'right' })
    doc.setDrawColor(...red)
    doc.setLineWidth(1.5)
    doc.line(margin, topPad + headerH, pageW - margin, topPad + headerH)
    doc.setDrawColor(0, 0, 0)
    doc.setTextColor(30, 41, 59)
  }

  function addFooter() {
    const fy = pageH - footerH - bottomPad
    doc.setFillColor(...lightGray)
    doc.rect(0, fy, pageW, footerH, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(`Page ${pageNum} of ${totalPagesExp}`, margin, fy + 17)
    doc.text('CONFIDENTIAL', pageW / 2, fy + 17, { align: 'center' })
    doc.text('Initials: ______', pageW - margin, fy + 17, { align: 'right' })
    doc.setTextColor(30, 41, 59)
  }

  return { doc, pageW, pageH, margin, contentW, red, navy, lightGray, topPad, bottomPad, footerH, headerH, contentTop, contentBottom, totalPagesExp, addHeader, addFooter, pageNum: () => pageNum }
}

export async function generateProposalPDF(data) {
  const { bid, contact, customer, revision, date, total_price,
    description, drawings_used, detailed_description, clarifications,
    work_not_included, terms, price_breakdown, alternates, settings } = data

  const logo = settings?.logo_url ? await loadImage(settings.logo_url) : null
  const { doc, pageW, pageH, margin, contentW, red, navy, lightGray, topPad, headerH, bottomPad, footerH, contentTop, contentBottom, totalPagesExp, addHeader, addFooter } = buildDoc(settings)
  let pageNum = 0

  function myAddHeader() {
    pageNum++
    if (logo) {
      const maxH = 40; const maxW = 110
      const lh = maxH; const lw = Math.min(maxW, lh * (logo.w / logo.h))
      try { doc.addImage(logo.data, logo.format, margin, topPad + 4, lw, lh) } catch {}
    }
    const bizName = settings?.business_name || ''
    const bizAddr = settings ? [settings.business_address, settings.business_city, settings.business_state, settings.business_zip].filter(Boolean).join(', ') : ''
    const bizContactStr = settings ? [settings.business_phone, settings.business_email].filter(Boolean).join('   ') : ''
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(0, 0, 0)
    if (bizName) doc.text(bizName, pageW - margin, topPad + 18, { align: 'right' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 80)
    if (bizAddr) doc.text(bizAddr, pageW - margin, topPad + 30, { align: 'right' })
    if (bizContactStr) doc.text(bizContactStr, pageW - margin, topPad + 41, { align: 'right' })
    doc.setDrawColor(...red); doc.setLineWidth(1.5)
    doc.line(margin, topPad + headerH, pageW - margin, topPad + headerH)
    doc.setDrawColor(0, 0, 0); doc.setTextColor(30, 41, 59)
  }

  function myAddFooter() {
    const fy = pageH - footerH - bottomPad
    doc.setFillColor(...lightGray)
    doc.rect(0, fy, pageW, footerH, 'F')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139)
    doc.text(`Page ${pageNum} of ${totalPagesExp}`, margin, fy + 17)
    doc.text('CONFIDENTIAL', pageW / 2, fy + 17, { align: 'center' })
    doc.text('Initials: ______', pageW - margin, fy + 17, { align: 'right' })
    doc.setTextColor(30, 41, 59)
  }

  function newPage() {
    myAddFooter(); doc.addPage(); myAddHeader()
    return contentTop
  }

  function checkY(y, needed = 60) {
    if (y + needed > contentBottom) return newPage()
    return y
  }

  function sectionBar(y, title) {
    y = checkY(y, 36)
    doc.setFillColor(...lightGray)
    doc.rect(margin, y, contentW, 20, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...navy)
    doc.text(title.toUpperCase(), margin + 8, y + 13)
    doc.setTextColor(30, 41, 59)
    return y + 26
  }

  // Render parsed lines with hanging indent
  function renderLines(y, lines) {
    if (!lines?.length) return y
    const lineH = 13
    const baseX = margin + 8
    const depthPad = 14

    for (const line of lines) {
      if (!line.text.trim()) { y += 6; continue }
      const depth = line.depth || 0
      const x = baseX + depth * depthPad
      const avail = contentW - 8 - depth * depthPad
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59)

      if (line.prefix) {
        const pStr = line.prefix + '  '
        const pW = doc.getTextWidth(pStr)
        const wrapped = doc.splitTextToSize(line.text, avail - pW)
        for (let i = 0; i < wrapped.length; i++) {
          y = checkY(y, lineH)
          if (i === 0) doc.text(pStr, x, y)
          doc.text(wrapped[i], x + pW, y)
          y += lineH
        }
      } else {
        const wrapped = doc.splitTextToSize(line.text, avail)
        for (const wl of wrapped) {
          y = checkY(y, lineH); doc.text(wl, x, y); y += lineH
        }
      }
    }
    return y + 4
  }

  function bodyText(y, text) {
    if (!text?.trim()) return y
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59)
    const lineH = 13
    const wrapped = doc.splitTextToSize(text, contentW - 8)
    for (const line of wrapped) {
      y = checkY(y, lineH); doc.text(line, margin + 8, y); y += lineH
    }
    return y + 4
  }

  // Start
  myAddHeader()
  let y = contentTop

  // PROPOSAL title
  doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(0, 0, 0)
  doc.text('PROPOSAL', pageW / 2, y + 14, { align: 'center' })
  y += 26
  doc.setDrawColor(...red); doc.setLineWidth(0.75)
  doc.line(pageW / 2 - 50, y, pageW / 2 + 50, y)
  doc.setDrawColor(0, 0, 0)
  y += 24

  // To / Attn / Project block — label column + content column
  const lblX = margin + 4
  const cntX = margin + 54  // Uniform indent for all content
  const rowH = 17
  const addrH = 12.5

  function lblRow(label, text, bold = false, fontSize = 10) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120)
    doc.text(label, lblX, y)
    if (bold) doc.setFont('helvetica', 'bold')
    else doc.setFont('helvetica', 'normal')
    doc.setFontSize(fontSize); doc.setTextColor(30, 41, 59)
    doc.text(text, cntX, y)
  }

  const companyName = customer?.company_name || ''
  if (companyName) { lblRow('To:', companyName, true); y += rowH }
  if (customer?.address) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(100, 100, 100)
    doc.text(customer.address, cntX, y); y += addrH
  }
  const custCity = [customer?.city, customer?.state, customer?.zip].filter(Boolean).join(', ')
  if (custCity) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(100, 100, 100)
    doc.text(custCity, cntX, y); y += rowH
  } else if (customer?.address) { y += 4 }

  if (contact) {
    const cName = contact.name || [contact.first_name, contact.last_name].filter(Boolean).join(' ')
    const cLine = [cName, contact.title].filter(Boolean).join(', ')
    if (cLine) { lblRow('Attn:', cLine, true); y += rowH }
    if (contact.phone) { lblRow('Phone:', contact.phone); y += rowH }
    if (contact.cellphone) { lblRow('Cell:', contact.cellphone); y += rowH }
    if (contact.email) { lblRow('Email:', contact.email); y += rowH }
  }
  y += 8

  if (bid?.project_name) { lblRow('Project:', bid.project_name, true); y += rowH }
  if (bid?.project_address) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(100, 100, 100)
    doc.text(bid.project_address, cntX, y); y += addrH
  }
  if (bid?.city || bid?.state || bid?.zip) {
    const projCity = [bid.city, bid.state, bid.zip].filter(Boolean).join(', ')
    if (projCity) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(100, 100, 100)
      doc.text(projCity, cntX, y); y += rowH
    }
  }
  y += 4

  // Date and revision right-aligned
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80)
  if (date) doc.text(`Date: ${formatDate(date)}`, pageW - margin, y, { align: 'right' })
  if (revision !== undefined && revision !== null) doc.text(`Revision: ${revision}`, pageW - margin, y + 14, { align: 'right' })
  y += 26

  // Divider
  doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  doc.setDrawColor(0, 0, 0); y += 14

  // Content sections
  const sections = [
    { val: description, label: 'Description' },
    { val: drawings_used, label: 'Drawings Referenced' },
    { val: detailed_description, label: 'Scope of Work' },
    { val: clarifications, label: 'Clarifications' },
    { val: work_not_included, label: 'Work Not Included' },
  ]

  for (const { val, label } of sections) {
    const lines = parseToLines(val)
    if (lines.length) { y = sectionBar(y, label); y = renderLines(y, lines); y += 4 }
  }

  // Price breakdown
  const hasBreakdown = price_breakdown?.some(r => r.description?.trim())
  if (hasBreakdown || total_price) {
    y = checkY(y, 100)
    if (hasBreakdown) {
      y = sectionBar(y, 'Price Breakdown')
      const rows = price_breakdown.filter(r => r.description).map(r => [r.description, formatMoney(r.amount)])
      doc.autoTable({
        startY: y, margin: { left: margin, right: margin },
        head: [['Description', 'Amount']], body: rows,
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: navy, textColor: [255, 255, 255], fontSize: 8.5 },
        alternateRowStyles: { fillColor: lightGray },
        columnStyles: { 1: { halign: 'right', cellWidth: 100 } },
        didDrawPage: () => { pageNum++ },
      })
      y = doc.lastAutoTable.finalY + 8
    }
    if (total_price) {
      y = checkY(y, 24)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...navy)
      doc.text('Total Price:', margin + 8, y)
      doc.text(formatMoney(total_price), pageW - margin, y, { align: 'right' })
      doc.setTextColor(30, 41, 59); y += 18
    }
  }

  // Alternates
  const hasAlternates = alternates?.some(r => r.description?.trim())
  if (hasAlternates) {
    y = checkY(y, 80); y = sectionBar(y, 'Alternates')
    const rows = alternates.filter(r => r.description).map(r => [r.description, formatMoney(r.amount)])
    doc.autoTable({
      startY: y, margin: { left: margin, right: margin },
      head: [['Alternate Description', 'Amount']], body: rows,
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: navy, textColor: [255, 255, 255], fontSize: 8.5 },
      alternateRowStyles: { fillColor: lightGray },
      columnStyles: { 1: { halign: 'right', cellWidth: 100 } },
    })
    y = doc.lastAutoTable.finalY + 12
  }

  const termsLines = parseToLines(terms) || (terms ? [{ text: stripHtml(terms), prefix: '', depth: 0 }] : [])
  if (termsLines.length) { y = sectionBar(y, 'Terms and Conditions'); y = renderLines(y, termsLines); y += 4 }

  // Signature page
  y = newPage(); y = sectionBar(y, 'Authorization and Acceptance'); y += 10
  y = bodyText(y, `By signing below, the authorized representative agrees to the terms, price, and scope of work outlined in this proposal.\n\nProject: ${bid?.project_name || ''}\nProposal Date: ${formatDate(date)}    Revision: ${revision}${total_price ? `\nTotal Price: ${formatMoney(total_price)}` : ''}`)
  y += 30

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59)
  doc.line(margin, y, margin + 220, y)
  doc.line(margin + 260, y, margin + 420, y)
  doc.text('Authorized Signature', margin, y + 14)
  doc.text('Printed Name', margin + 260, y + 14)
  y += 50
  doc.line(margin, y, margin + 140, y)
  doc.text('Date', margin, y + 14)

  myAddFooter()
  doc.putTotalPages(totalPagesExp)
  const fileName = `${(bid?.project_name || 'Proposal').replace(/\s+/g, '_')}_Rev${revision}.pdf`
  doc.save(fileName)
}

export async function generateRFQPDF(data) {
  const { bid, rfq, settings } = data
  const logo = settings?.logo_url ? await loadImage(settings.logo_url) : null
  const { doc, pageW, pageH, margin, contentW, red, navy, lightGray, topPad, headerH, bottomPad, footerH, contentTop, contentBottom, totalPagesExp } = buildDoc(settings)
  let pageNum = 0

  function myHeader() {
    pageNum++
    if (logo) {
      const lh = 40; const lw = Math.min(110, lh * (logo.w / logo.h))
      try { doc.addImage(logo.data, logo.format, margin, topPad + 4, lw, lh) } catch {}
    }
    const bizName = settings?.business_name || ''
    const bizAddr = settings ? [settings.business_address, settings.business_city, settings.business_state, settings.business_zip].filter(Boolean).join(', ') : ''
    const bizPhone = settings ? [settings.business_phone, settings.business_email].filter(Boolean).join('   ') : ''
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(0, 0, 0)
    if (bizName) doc.text(bizName, pageW - margin, topPad + 18, { align: 'right' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 80)
    if (bizAddr) doc.text(bizAddr, pageW - margin, topPad + 30, { align: 'right' })
    if (bizPhone) doc.text(bizPhone, pageW - margin, topPad + 41, { align: 'right' })
    doc.setDrawColor(...red); doc.setLineWidth(1.5)
    doc.line(margin, topPad + headerH, pageW - margin, topPad + headerH)
    doc.setDrawColor(0, 0, 0); doc.setTextColor(30, 41, 59)
  }

  function myFooter() {
    const fy = pageH - footerH - bottomPad
    doc.setFillColor(...lightGray); doc.rect(0, fy, pageW, footerH, 'F')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139)
    doc.text(`Page ${pageNum} of ${totalPagesExp}`, margin, fy + 17)
    doc.text('CONFIDENTIAL', pageW / 2, fy + 17, { align: 'center' })
    doc.text('Initials: ______', pageW - margin, fy + 17, { align: 'right' })
    doc.setTextColor(30, 41, 59)
  }

  function checkY(y, n = 40) {
    if (y + n > pageH - footerH - bottomPad - 8) { myFooter(); doc.addPage(); myHeader(); return contentTop }
    return y
  }

  function sBar(y, t) {
    y = checkY(y, 30); doc.setFillColor(...lightGray); doc.rect(margin, y, contentW, 20, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...navy)
    doc.text(t.toUpperCase(), margin + 8, y + 13); doc.setTextColor(30, 41, 59); return y + 26
  }

  function renderLines(y, lines) {
    if (!lines?.length) return y
    const lineH = 13; const baseX = margin + 8; const dPad = 14
    for (const line of lines) {
      if (!line.text.trim()) { y += 6; continue }
      const x = baseX + (line.depth || 0) * dPad
      const avail = contentW - 8 - (line.depth || 0) * dPad
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59)
      if (line.prefix) {
        const pStr = line.prefix + '  '; const pW = doc.getTextWidth(pStr)
        const wrapped = doc.splitTextToSize(line.text, avail - pW)
        for (let i = 0; i < wrapped.length; i++) {
          y = checkY(y, lineH); if (i === 0) doc.text(pStr, x, y); doc.text(wrapped[i], x + pW, y); y += lineH
        }
      } else {
        for (const wl of doc.splitTextToSize(line.text, avail)) { y = checkY(y, lineH); doc.text(wl, x, y); y += lineH }
      }
    }
    return y + 4
  }

  myHeader()
  let y = contentTop

  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(0, 0, 0)
  doc.text('REQUEST FOR QUOTATION', pageW / 2, y + 12, { align: 'center' })
  y += 22; doc.setDrawColor(...red); doc.setLineWidth(0.75)
  doc.line(pageW / 2 - 80, y, pageW / 2 + 80, y)
  doc.setDrawColor(0, 0, 0); y += 18

  if (rfq.header) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(30, 41, 59)
    doc.text(rfq.header, pageW / 2, y, { align: 'center' }); y += 20
  }
  y += 4

  const lblX = margin + 4; const cX = margin + 54
  if (rfq.vendor_name) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120)
    doc.text('To:', lblX, y)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 41, 59)
    doc.text(rfq.vendor_name, cX, y); y += 17
  }
  if (rfq.vendor_contact) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120)
    doc.text('Attn:', lblX, y)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 41, 59)
    doc.text(rfq.vendor_contact, cX, y); y += 17
  }
  if (rfq.vendor_email) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(100, 100, 100)
    doc.text(rfq.vendor_email, cX, y); y += 14
  }
  y += 8

  if (bid?.project_name) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120)
    doc.text('Project:', lblX, y)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 41, 59)
    doc.text(bid.project_name, cX, y); y += 17
  }
  if (rfq.due_date) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59)
    doc.text(`Quote Due: ${formatDate(rfq.due_date)}`, pageW - margin, y - 17, { align: 'right' })
  }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80)
  doc.text(`Date: ${formatDate(new Date().toISOString().slice(0, 10))}`, pageW - margin, y, { align: 'right' })
  y += 18
  doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y); doc.setDrawColor(0, 0, 0); y += 14

  const contentLines = parseToLines(rfq.content)
  if (contentLines.length) { y = sBar(y, 'Scope / Description'); y = renderLines(y, contentLines); y += 4 }

  myFooter(); doc.putTotalPages(totalPagesExp)
  doc.save(`RFQ_${(bid?.project_name || 'Project').replace(/\s+/g, '_')}.pdf`)
}

export async function generateRFIPDF(data) {
  const { bid, rfi, settings } = data
  const logo = settings?.logo_url ? await loadImage(settings.logo_url) : null
  const { doc, pageW, pageH, margin, contentW, red, navy, lightGray, topPad, headerH, bottomPad, footerH, contentTop, contentBottom, totalPagesExp } = buildDoc(settings)
  let pageNum = 0

  function myHeader() {
    pageNum++
    if (logo) {
      const lh = 40; const lw = Math.min(110, lh * (logo.w / logo.h))
      try { doc.addImage(logo.data, logo.format, margin, topPad + 4, lw, lh) } catch {}
    }
    const bizName = settings?.business_name || ''
    const bizAddr = settings ? [settings.business_address, settings.business_city, settings.business_state, settings.business_zip].filter(Boolean).join(', ') : ''
    const bizPhone = settings ? [settings.business_phone, settings.business_email].filter(Boolean).join('   ') : ''
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(0, 0, 0)
    if (bizName) doc.text(bizName, pageW - margin, topPad + 18, { align: 'right' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 80)
    if (bizAddr) doc.text(bizAddr, pageW - margin, topPad + 30, { align: 'right' })
    if (bizPhone) doc.text(bizPhone, pageW - margin, topPad + 41, { align: 'right' })
    doc.setDrawColor(...red); doc.setLineWidth(1.5)
    doc.line(margin, topPad + headerH, pageW - margin, topPad + headerH)
    doc.setDrawColor(0, 0, 0); doc.setTextColor(30, 41, 59)
  }

  function myFooter() {
    const fy = pageH - footerH - bottomPad
    doc.setFillColor(...lightGray); doc.rect(0, fy, pageW, footerH, 'F')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 116, 139)
    doc.text(`Page ${pageNum} of ${totalPagesExp}`, margin, fy + 17)
    doc.text('CONFIDENTIAL', pageW / 2, fy + 17, { align: 'center' })
    doc.text('Initials: ______', pageW - margin, fy + 17, { align: 'right' })
    doc.setTextColor(30, 41, 59)
  }

  function checkY(y, n = 40) {
    if (y + n > pageH - footerH - bottomPad - 8) { myFooter(); doc.addPage(); myHeader(); return contentTop }
    return y
  }

  function sBar(y, t) {
    y = checkY(y, 30); doc.setFillColor(...lightGray); doc.rect(margin, y, contentW, 20, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...navy)
    doc.text(t.toUpperCase(), margin + 8, y + 13); doc.setTextColor(30, 41, 59); return y + 26
  }

  function renderLines(y, lines) {
    if (!lines?.length) return y
    const lineH = 13; const baseX = margin + 8; const dPad = 14
    for (const line of lines) {
      if (!line.text.trim()) { y += 6; continue }
      const x = baseX + (line.depth || 0) * dPad
      const avail = contentW - 8 - (line.depth || 0) * dPad
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 41, 59)
      if (line.prefix) {
        const pStr = line.prefix + '  '; const pW = doc.getTextWidth(pStr)
        const wrapped = doc.splitTextToSize(line.text, avail - pW)
        for (let i = 0; i < wrapped.length; i++) {
          y = checkY(y, lineH); if (i === 0) doc.text(pStr, x, y); doc.text(wrapped[i], x + pW, y); y += lineH
        }
      } else {
        for (const wl of doc.splitTextToSize(line.text, avail)) { y = checkY(y, lineH); doc.text(wl, x, y); y += lineH }
      }
    }
    return y + 4
  }

  myHeader()
  let y = contentTop

  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(0, 0, 0)
  doc.text('REQUEST FOR INFORMATION', pageW / 2, y + 12, { align: 'center' })
  y += 22; doc.setDrawColor(...red); doc.setLineWidth(0.75)
  doc.line(pageW / 2 - 80, y, pageW / 2 + 80, y)
  doc.setDrawColor(0, 0, 0); y += 18

  if (rfi.header) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(30, 41, 59)
    doc.text(rfi.header, pageW / 2, y, { align: 'center' }); y += 20
  }
  y += 4

  const lblX = margin + 4; const cX = margin + 54
  if (rfi.sent_to_name) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120)
    doc.text('To:', lblX, y)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 41, 59)
    doc.text(rfi.sent_to_name, cX, y); y += 17
  }
  if (rfi.sent_to_contact) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120)
    doc.text('Attn:', lblX, y)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 41, 59)
    doc.text(rfi.sent_to_contact, cX, y); y += 17
  }
  if (bid?.project_name) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120)
    doc.text('Project:', lblX, y)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 41, 59)
    doc.text(bid.project_name, cX, y); y += 17
  }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80)
  doc.text(`Date: ${formatDate(new Date().toISOString().slice(0, 10))}`, pageW - margin, y - 17, { align: 'right' })
  y += 8
  doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y); doc.setDrawColor(0, 0, 0); y += 14

  const qLines = parseToLines(rfi.question)
  if (qLines.length) { y = sBar(y, 'Information Requested'); y = renderLines(y, qLines); y += 4 }

  if (rfi.response?.trim()) {
    const rLines = parseToLines(rfi.response)
    if (rLines.length) { y = sBar(y, 'Response'); y = renderLines(y, rLines) }
  }

  myFooter(); doc.putTotalPages(totalPagesExp)
  doc.save(`RFI_${(bid?.project_name || 'Project').replace(/\s+/g, '_')}.pdf`)
}
