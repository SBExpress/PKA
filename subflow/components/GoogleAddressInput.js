'use client'

import { useEffect, useRef, useState } from 'react'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function GoogleAddressInput({ value, onChange, onLocationChange }) {
  const inputRef = useRef(null)
  const autocompleteRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (window.google?.maps?.places) {
      setLoaded(true)
    } else {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.onload = () => setLoaded(true)
      document.head.appendChild(script)
    }
  }, [])

  useEffect(() => {
    if (!loaded || !inputRef.current) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode']
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace()
      if (place.geometry) {
        onChange?.(place.formatted_address)
        onLocationChange?.({
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        })
      }
    })
  }, [loaded, onChange, onLocationChange])

  return (
    <input
      ref={inputRef}
      type="text"
      className={field}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder="Enter address (e.g., 123 Main St, New York, NY)"
    />
  )
}
