'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Wrong email or password.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">SubFlow</h1>
          <p className="text-slate-400 text-sm mt-1">
            {resetMode ? 'Reset your password' : 'Sign in to your account'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-4">
          {resetSent ? (
            <div className="text-center space-y-3">
              <p className="text-green-700 text-sm font-medium">Check your email for a reset link.</p>
              <button onClick={() => { setResetMode(false); setResetSent(false) }} className="text-blue-600 text-sm hover:underline">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={resetMode ? handleReset : handleLogin} className="space-y-4">
              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!resetMode && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
              >
                {loading ? (resetMode ? 'Sending...' : 'Signing in...') : (resetMode ? 'Send Reset Link' : 'Sign In')}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setResetMode(!resetMode); setError('') }}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  {resetMode ? 'Back to sign in' : 'Forgot your password?'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
