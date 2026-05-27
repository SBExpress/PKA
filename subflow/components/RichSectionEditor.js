'use client'

import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import { Mark, mergeAttributes } from '@tiptap/core'
import { createClient } from '@/lib/supabase'
import { Bold, Italic, List, ListOrdered, Heading2, BookOpen, Plus, Edit2, Trash2, Check, X } from 'lucide-react'

const FontSize = Mark.create({
  name: 'fontSize',
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: el => el.style.fontSize,
        renderHTML: attrs => ({ style: `font-size: ${attrs.size}` }),
      },
    }
  },
  parseHTML() { return [{ tag: 'span[style*="font-size"]' }] },
  renderHTML({ HTMLAttributes }) { return ['span', mergeAttributes(HTMLAttributes)] },
  addCommands() {
    return {
      setFontSize: size => ({ commands }) => commands.setMark('fontSize', { size: `${size}pt` }),
      unsetFontSize: () => ({ commands }) => commands.unsetMark('fontSize'),
    }
  },
})

const FONT_SIZES = [9, 10, 11, 12, 14, 16, 18, 20, 24]

export default function RichSectionEditor({ sectionKey, value, onChange }) {
  const supabase = createClient()
  const [templates, setTemplates] = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContent, setNewContent] = useState('')
  const panelRef = useRef(null)

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, FontSize],
    content: value || '',
    editorProps: {
      attributes: { class: 'tiptap-content min-h-[120px] px-3 py-2.5 focus:outline-none text-sm text-slate-800 leading-relaxed' },
    },
    onUpdate({ editor }) { onChange(editor.getHTML()) },
  })

  useEffect(() => {
    if (!editor) return
    const editorHTML = editor.getHTML()
    if (value !== undefined && value !== editorHTML) {
      editor.commands.setContent(value || '', false)
    }
  }, [editor, value])

  useEffect(() => {
    if (!sectionKey) return
    supabase.from('proposal_templates').select('*').eq('section', sectionKey).order('name').then(({ data }) => setTemplates(data || []))
  }, [sectionKey])

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function insertTemplate(content) {
    if (!editor) return
    editor.chain().focus().insertContent(content).run()
    setShowPanel(false)
  }

  async function saveTemplate() {
    if (!newName.trim() || !newContent.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('proposal_templates').insert({ section: sectionKey, name: newName.trim(), content: newContent, user_id: user.id }).select().single()
    if (data) { setTemplates(t => [...t, data].sort((a, b) => a.name.localeCompare(b.name))); setNewName(''); setNewContent(''); setShowNewForm(false) }
  }

  async function updateTemplate(id) {
    await supabase.from('proposal_templates').update({ name: editName, updated_at: new Date().toISOString() }).eq('id', id)
    setTemplates(t => t.map(x => x.id === id ? { ...x, name: editName } : x))
    setEditingId(null)
  }

  async function deleteTemplate(id) {
    await supabase.from('proposal_templates').delete().eq('id', id)
    setTemplates(t => t.filter(x => x.id !== id))
  }

  if (!editor) return null

  const btnCls = (active) => `p-1.5 rounded transition-colors ${active ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`

  return (
    <div className="border border-slate-200 rounded-lg overflow-visible focus-within:ring-2 focus-within:ring-blue-500">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50 flex-wrap">
        <button type="button" title="Bold" className={btnCls(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={13} /></button>
        <button type="button" title="Italic" className={btnCls(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={13} /></button>
        <button type="button" title="Heading" className={btnCls(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={13} /></button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button type="button" title="Bullet List" className={btnCls(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={13} /></button>
        <button type="button" title="Numbered List" className={btnCls(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={13} /></button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <select
          className="text-xs border border-slate-200 rounded px-1 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={editor.isActive('fontSize') ? (editor.getAttributes('fontSize').size?.replace('pt', '') || '') : ''}
          onChange={e => {
            if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run()
            else editor.chain().focus().unsetFontSize().run()
          }}
          title="Font size"
        >
          <option value="">Size</option>
          {FONT_SIZES.map(s => <option key={s} value={String(s)}>{s}pt</option>)}
        </select>

        {sectionKey && (
          <div className="relative ml-auto" ref={panelRef}>
            <button
              type="button"
              onClick={() => setShowPanel(p => !p)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-white transition-colors"
            >
              <BookOpen size={12} /> Templates
            </button>

            {showPanel && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-72">
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Templates</span>
                  <button type="button" onClick={() => setShowNewForm(p => !p)} className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1"><Plus size={11} /> New</button>
                </div>

                {showNewForm && (
                  <div className="p-3 border-b border-slate-100 space-y-2 bg-slate-50">
                    <input
                      className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Template name *"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                    />
                    <textarea
                      rows={3}
                      className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Template content..."
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={saveTemplate} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg">Save</button>
                      <button type="button" onClick={() => setShowNewForm(false)} className="text-slate-500 text-xs px-2 py-1.5">Cancel</button>
                    </div>
                  </div>
                )}

                <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {!templates.length && <li className="px-3 py-3 text-xs text-slate-400">No templates yet. Click New to add one.</li>}
                  {templates.map(t => (
                    <li key={t.id} className="group flex items-center gap-1 px-3 py-2 hover:bg-blue-50 transition-colors">
                      {editingId === t.id ? (
                        <>
                          <input className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" value={editName} onChange={e => setEditName(e.target.value)} />
                          <button type="button" onClick={() => updateTemplate(t.id)} className="text-green-600 hover:text-green-700 p-1"><Check size={12} /></button>
                          <button type="button" onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 p-1"><X size={12} /></button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => insertTemplate(t.content)} className="flex-1 text-left text-sm text-slate-700 hover:text-blue-700">{t.name}</button>
                          <button type="button" onClick={() => { setEditingId(t.id); setEditName(t.name) }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 p-1 transition-opacity"><Edit2 size={11} /></button>
                          <button type="button" onClick={() => deleteTemplate(t.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 p-1 transition-opacity"><Trash2 size={11} /></button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
