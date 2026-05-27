'use client'

import { useState, useRef, useEffect } from 'react'

const STATE_CODES = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
}

export default function AddressAutocomplete({ value, onChange, placeholder = 'Start typing an address...' }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    onChange({ address: val })
    clearTimeout(timerRef.current)
    if (val.length < 3) { setSuggestions([]); setOpen(false); return }
    timerRef.current = setTimeout(() => search(val), 350)
  }

  async function search(q) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: q,
        format: 'json',
        addressdetails: '1',
        limit: '6',
        countrycodes: 'us',
        viewbox: '-75.5,39.5,-71.5,42.5',
        bounded: '0',
      })
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'Accept-Language': 'en-US,en' }
      })
      const data = await res.json()
      setSuggestions(data)
      setOpen(data.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  function select(item) {
    const a = item.address || {}
    const streetNum = a.house_number || ''
    const road = a.road || ''
    const street = [streetNum, road].filter(Boolean).join(' ')
    const city = a.city || a.town || a.village || a.municipality || a.county || ''
    const stateName = a.state || ''
    const state = STATE_CODES[stateName] || (stateName.length === 2 ? stateName.toUpperCase() : '')
    const zip = a.postcode || ''

    setQuery(street)
    setOpen(false)
    setSuggestions([])
    onChange({ address: street, city, state, zip })
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {loading && (
        <span className="absolute right-3 top-2.5 text-xs text-slate-400">Searching...</span>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-56 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => select(s)}
              className="px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
