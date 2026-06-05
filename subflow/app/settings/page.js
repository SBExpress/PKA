'use client'

import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase'
import { useOrganization } from '@/lib/useOrganization'
import { Upload, Check } from 'lucide-react'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const lbl = 'block text-sm font-medium text-slate-700 mb-1'

const COLOR_PRESETS = [
  { label: 'Navy', value: '#1a2744' },
  { label: 'Dark Blue', value: '#1e3a8a' },
  { label: 'Slate', value: '#334155' },
  { label: 'Dark Green', value: '#14532d' },
  { label: 'Maroon', value: '#7f1d1d' },
  { label: 'Black', value: '#0f172a' },
]

export default function SettingsPage() {
  const supabase = createClient()
  const { org, loading: orgLoading } = useOrganization()
  const fileRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [form, setForm] = useState({
    business_name: '',
    business_address: '',
    business_city: '',
    business_state: '',
    business_zip: '',
    business_phone: '',
    business_email: '',
    primary_color: '#1a2744',
    logo_url: '',
  })

  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  useEffect(() => {
    async function load() {
      if (orgLoading || !org) return
      const { data } = await supabase.from('settings').select('*').eq('organization_id', org.id).single()
      if (data) setForm(f => ({ ...f, ...data }))
    }
    load()
  }, [org, orgLoading, supabase])

  async function handleSave(e) {
    e.preventDefault()
    if (!org) return
    setLoading(true)
    await supabase.from('settings').upsert({ ...form, organization_id: org.id, updated_at: new Date().toISOString() }, { onConflict: 'organization_id' })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleLogoUpload(e) {
    if (!org) return
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError('')
    setUploadSuccess(false)

    try {
      const ext = file.name.split('.').pop()
      const path = `${org.id}/logo.${ext}`

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        if (uploadError.message.includes('not found')) {
          setUploadError('Logo bucket not found. Please create a "logos" bucket in Supabase Storage with public access.')
        } else {
          setUploadError(uploadError.message || 'Failed to upload logo')
        }
        setUploading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(path)
      const newUrl = publicUrlData.publicUrl + '?t=' + Date.now()
      set('logo_url', newUrl)

      const { error: dbError } = await supabase.from('settings').upsert(
        { ...form, logo_url: newUrl, organization_id: org.id, updated_at: new Date().toISOString() },
        { onConflict: 'organization_id' }
      )

      if (dbError) {
        setUploadError('Failed to save logo URL: ' + dbError.message)
      } else {
        setUploadSuccess(true)
        setTimeout(() => setUploadSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Logo upload error:', err)
      setUploadError(err.message || 'An unexpected error occurred')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-slate-700 mb-4">Business Information</h2>
            <p className="text-xs text-slate-400 mb-4">This information appears on your proposal PDF header.</p>
            <div className="space-y-4">
              <div>
                <label className={lbl}>Business Name</label>
                <input className={field} value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Express Electric, Inc." />
              </div>
              <div>
                <label className={lbl}>Address</label>
                <input className={field} value={form.business_address} onChange={e => set('business_address', e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>City</label>
                  <input className={field} value={form.business_city} onChange={e => set('business_city', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>State</label>
                  <input className={field} value={form.business_state} onChange={e => set('business_state', e.target.value)} maxLength={2} />
                </div>
                <div>
                  <label className={lbl}>Zip</label>
                  <input className={field} value={form.business_zip} onChange={e => set('business_zip', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Phone</label>
                  <input className={field} value={form.business_phone} onChange={e => set('business_phone', e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Email</label>
                  <input type="email" className={field} value={form.business_email} onChange={e => set('business_email', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-slate-700 mb-4">Logo</h2>
            <p className="text-xs text-slate-400 mb-4">Your logo appears in the top left of the proposal PDF header.</p>

            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                <Check size={14} />
                Logo uploaded successfully!
              </div>
            )}

            <div className="flex items-center gap-4 mb-4">
              {form.logo_url && (
                <img src={form.logo_url} alt="Logo" className="h-14 object-contain border border-slate-200 rounded-lg p-2" />
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                <Upload size={14} />
                {uploading ? 'Uploading...' : form.logo_url ? 'Change Logo' : 'Upload Logo'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              {form.logo_url && (
                <button type="button" onClick={() => set('logo_url', '')} className="text-xs text-red-400 hover:text-red-600">Remove</button>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-blue-900 font-medium mb-1">Setup required:</p>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to your Supabase dashboard → Storage</li>
                <li>Click "New bucket"</li>
                <li>Name it "logos" (exactly)</li>
                <li>Enable "Public bucket"</li>
                <li>Create the bucket, then try uploading again</li>
              </ol>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-slate-700 mb-2">Letterhead Color</h2>
            <p className="text-xs text-slate-400 mb-4">This is the background color of the header band on your proposal PDF.</p>
            <div className="flex flex-wrap gap-3 mb-4">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set('primary_color', c.value)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors"
                  style={{ borderColor: form.primary_color === c.value ? c.value : '#e2e8f0', backgroundColor: form.primary_color === c.value ? c.value + '15' : 'white' }}
                >
                  <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: c.value }} />
                  {c.label}
                  {form.primary_color === c.value && <Check size={12} className="text-green-600" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600">Custom color:</label>
              <input type="color" value={form.primary_color} onChange={e => set('primary_color', e.target.value)} className="w-10 h-8 rounded border border-slate-200 cursor-pointer" />
              <span className="text-sm text-slate-500 font-mono">{form.primary_color}</span>
            </div>
            <div className="mt-4 rounded-lg overflow-hidden border border-slate-200">
              <div className="px-5 py-3 text-white text-sm font-semibold" style={{ backgroundColor: form.primary_color }}>
                Preview: Proposal Header
              </div>
              <div className="px-5 py-2 text-xs text-slate-500 bg-white">Proposal content area</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-60">
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
            {saved && <span className="text-green-600 text-sm flex items-center gap-1"><Check size={14} /> Saved</span>}
          </div>
        </form>
      </main>
    </div>
  )
}
