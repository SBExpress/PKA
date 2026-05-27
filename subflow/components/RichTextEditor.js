'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import { Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react'

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [StarterKit, Typography],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[120px] px-3 py-2 focus:outline-none text-slate-800',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  const btn = (active, action, title, children) => (
    <button
      type="button"
      title={title}
      onClick={action}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50">
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold', <Bold size={14} />)}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic', <Italic size={14} />)}
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading', <Heading2 size={14} />)}
        <div className="w-px h-4 bg-slate-200 mx-1" />
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bullet List', <List size={14} />)}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Numbered List', <ListOrdered size={14} />)}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
