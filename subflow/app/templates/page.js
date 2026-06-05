'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import RichSectionEditor from '@/components/RichSectionEditor'
import { createClient } from '@/lib/supabase'
import { Plus, Trash2, ChevronDown } from 'lucide-react'

const SECTIONS = [
  { value: 'detailed_description', label: 'Scope of Work' },
  { value: 'clarifications', label: 'Clarifications' },
  { value: 'work_not_included', label: 'Work Not Included' },
  { value: 'terms', label: 'Terms' },
]

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function TemplatesPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ section: 'detailed_description', name: '', content: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('proposal_templates').select('*').order('section').order('name').then(({ data }) => setTemplates(data || []))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (editing) {
      await supabase.from('proposal_templates').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing)
      setTemplates(t => t.map(x => x.id === editing ? { ...x, ...form } : x))
    } else {
      const { data } = await supabase.from('proposal_templates').insert({ ...form, user_id: user.id }).select().single()
      setTemplates(t => [...t, data])
    }
    setEditing(null)
    setForm({ section: 'detailed_description', name: '', content: '' })
    setLoading(false)
  }

  async function handleDelete(id) {
    await supabase.from('proposal_templates').delete().eq('id', id)
    setTemplates(t => t.filter(x => x.id !== id))
    if (editing === id) { setEditing(null); setForm({ section: 'detailed_description', name: '', content: '' }) }
  }

  function startEdit(t) {
    setEditing(t.id)
    setForm({ section: t.section, name: t.name, content: t.content || '' })
  }

  const grouped = SECTIONS.map(s => ({
    ...s,
    items: templates.filter(t => t.section === s.value),
  }))

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Proposal Templates</h1>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-4">
            {grouped.map(group => (
              <div key={group.value} className="bg-white rounded-xl shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="font-medium text-slate-700 text-sm">{group.label}</p>
                </div>
                {!group.items.length ? (
                  <p className="px-4 py-3 text-slate-400 text-xs">No templates yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {group.items.map(t => (
                      <li key={t.id} className={`flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${editing === t.id ? 'bg-blue-50' : ''}`} onClick={() => startEdit(t)}>
                        <span className="text-sm text-slate-700">{t.name}</span>
                        <button type="button" onClick={e => { e.stopPropagation(); handleDelete(t.id) }} className="text-slate-300 hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <button
              onClick={() => { setEditing(null); setForm({ section: 'detailed_description', name: '', content: '' }) }}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus size={14} /> New Template
            </button>
          </div>

          <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-slate-700 mb-4">{editing ? 'Edit Template' : 'New Template'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                  <select className={field} value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}>
                    {SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Template Name *</label>
                  <input required className={field} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard Lighting" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                <RichSectionEditor value={form.content} onChange={v => setForm(f => ({ ...f, content: v }))} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-60">
                  {loading ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
