import { useState, useEffect } from "react"

export interface Preferences {
  // Default calculation values
  defaultAmperage: number
  defaultVoltage: number
  defaultConductorType: "copper" | "aluminum"
  defaultPhase: "single" | "three"
  defaultTempRating: string
  defaultVoltageDropPercent: number
  defaultRunLength: number | null

  // UI Preferences
  ampsPerClick: number

  // Wire size limits
  maxCopperWireSize: string
  maxAluminumWireSize: string
}

const DEFAULT_PREFERENCES: Preferences = {
  defaultAmperage: 100,
  defaultVoltage: 208,
  defaultConductorType: "copper",
  defaultPhase: "three",
  defaultTempRating: "75",
  defaultVoltageDropPercent: 3,
  defaultRunLength: null,
  ampsPerClick: 10,
  maxCopperWireSize: "600 kcmil",
  maxAluminumWireSize: "750 kcmil",
}

const STORAGE_KEY = "wirecalc-preferences"

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<Preferences>(DEFAULT_PREFERENCES)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults in case new preferences were added
        setPreferencesState({ ...DEFAULT_PREFERENCES, ...parsed })
      }
    } catch (error) {
      console.warn("Failed to load preferences from localStorage:", error)
    }
    setIsLoaded(true)
  }, [])

  const setPreferences = (newPreferences: Partial<Preferences>) => {
    setPreferencesState((prev) => {
      const updated = { ...prev, ...newPreferences }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.warn("Failed to save preferences to localStorage:", error)
      }
      return updated
    })
  }

  const resetPreferences = () => {
    setPreferencesState(DEFAULT_PREFERENCES)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn("Failed to reset preferences:", error)
    }
  }

  return {
    preferences,
    setPreferences,
    resetPreferences,
    isLoaded,
  }
}
