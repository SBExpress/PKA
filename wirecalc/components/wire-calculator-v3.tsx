"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CalculatorFormV3 } from "./calculator-form-v3"
import { ResultsDisplayV3 } from "./results-display-v3"
import { ResultsGridDual } from "./results-grid-dual"
import { ReferenceTabsV3 } from "./reference-tabs-v3"
import { SettingsDialog } from "./settings-dialog"
import { calculateOptimalFeeder, calculateDualResults, calculateManualWireResult, CalculationResult, DualCalculationResults, validateInputs } from "@/lib/wire-calculations-v3"
import { Sun, Moon, Zap, FileDown, Share2 } from "lucide-react"
import { useTheme } from "next-themes"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePreferences, Preferences } from "@/hooks/usePreferences"

interface Calculation {
  id: number
  timestamp: string
  title: string
  customName?: string // User-provided name for the run
  amperage: number
  voltage: number
  phase: "single" | "three"
  conductorType: "copper" | "aluminum"
  tempRating: string
  includeNeutral: boolean
  runLength: number | null
  maxVoltageDropPercent: number
  results: { copper: CalculationResult; aluminum: CalculationResult }
}

export function WireCalculatorV3() {
  const { theme, setTheme } = useTheme()
  const { preferences, setPreferences, resetPreferences, isLoaded } = usePreferences()
  const [mounted, setMounted] = useState(false)

  // Form states (initialized with defaults, will be overridden by preferences on mount)
  const [amperage, setAmperage] = useState(100)
  const [voltage, setVoltage] = useState(208)
  const [phase, setPhase] = useState<"single" | "three">("three")
  const [conductorType, setConductorType] = useState<"copper" | "aluminum">("copper")
  const [tempRating, setTempRating] = useState("75")
  const [includeNeutral, setIncludeNeutral] = useState(false)
  const [runLength, setRunLength] = useState<number | null>(null)
  const [maxVoltageDropPercent, setMaxVoltageDropPercent] = useState(3)

  // Manual override mode
  const [manualOverride, setManualOverride] = useState(false)
  const [manualWireSize, setManualWireSize] = useState("3/0 AWG")
  const [numberOfSets, setNumberOfSets] = useState(1)
  // Note: conduit size is auto-calculated, not manually selectable

  // Handle manual override toggle - pre-fill with recommended size
  const handleManualOverrideToggle = (value: boolean) => {
    setManualOverride(value)
    if (value && results) {
      const recommendedSize = conductorType === "copper" ? results.copper.industryStandard.wireSize : results.aluminum.industryStandard.wireSize
      const recommendedSets = conductorType === "copper" ? results.copper.industryStandard.sets : results.aluminum.industryStandard.sets
      setManualWireSize(recommendedSize)
      setNumberOfSets(recommendedSets)
    }
  }

  // Results - now includes both Industry Standard and Optimized
  const [results, setResults] = useState<{
    copper: DualCalculationResults
    aluminum: DualCalculationResults
  } | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [savedCalculations, setSavedCalculations] = useState<Calculation[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [runName, setRunName] = useState("")
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)

  // Load preferences on mount (only once when first loaded)
  useEffect(() => {
    setMounted(true)
    if (isLoaded) {
      setAmperage(preferences.defaultAmperage)
      setVoltage(preferences.defaultVoltage)
      setPhase(preferences.defaultPhase)
      setConductorType(preferences.defaultConductorType)
      setTempRating(preferences.defaultTempRating)
      setMaxVoltageDropPercent(preferences.defaultVoltageDropPercent)
      if (preferences.defaultRunLength !== null) {
        setRunLength(preferences.defaultRunLength)
      }
    }
  }, [isLoaded]) // Only depend on isLoaded, not on preferences

  // Calculate results - now returns both Industry Standard and Optimized
  const handleCalculate = () => {
    const errors = validateInputs(amperage, voltage, runLength)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors([])

    const copper = calculateDualResults(
      amperage,
      "copper",
      tempRating,
      phase,
      includeNeutral,
      voltage,
      maxVoltageDropPercent,
      runLength,
      preferences.maxCopperWireSize,
      preferences.maxAluminumWireSize,
    )

    const aluminum = calculateDualResults(
      amperage,
      "aluminum",
      tempRating,
      phase,
      includeNeutral,
      voltage,
      maxVoltageDropPercent,
      runLength,
      preferences.maxCopperWireSize,
      preferences.maxAluminumWireSize,
    )

    // If manual override is off, use auto results and update numberOfSets
    if (!manualOverride) {
      setNumberOfSets(copper.industryStandard.sets)
      setResults({ copper, aluminum })
    } else {
      // Manual override: only update the preferred conductor type
      // The alternative type shows auto-calculated results
      const preferredType = conductorType

      if (preferredType === "copper") {
        // Update copper with manual override, keep aluminum auto-calculated
        const manualCopperResult = calculateManualWireResult(
          amperage,
          manualWireSize,
          numberOfSets,
          "copper",
          tempRating,
          phase,
          includeNeutral,
          voltage,
          runLength,
          preferences.maxCopperWireSize,
          preferences.maxAluminumWireSize,
        )
        // Wrap manual result in DualCalculationResults structure (manual = industry standard)
        const manualCopper: DualCalculationResults = {
          industryStandard: manualCopperResult,
          optimized: copper.optimized,
        }
        setResults({ copper: manualCopper, aluminum })
      } else {
        // Update aluminum with manual override, keep copper auto-calculated
        const manualAluminumResult = calculateManualWireResult(
          amperage,
          manualWireSize,
          numberOfSets,
          "aluminum",
          tempRating,
          phase,
          includeNeutral,
          voltage,
          runLength,
          preferences.maxCopperWireSize,
          preferences.maxAluminumWireSize,
        )
        // Wrap manual result in DualCalculationResults structure (manual = industry standard)
        const manualAluminum: DualCalculationResults = {
          industryStandard: manualAluminumResult,
          optimized: aluminum.optimized,
        }
        setResults({ copper, aluminum: manualAluminum })
      }
    }
  }

  // Auto-calculate on input change
  useEffect(() => {
    if (amperage && voltage) {
      const timer = setTimeout(handleCalculate, 300)
      return () => clearTimeout(timer)
    }
  }, [amperage, voltage, phase, conductorType, tempRating, includeNeutral, runLength, maxVoltageDropPercent])

  const saveCalculation = (customName?: string) => {
    if (!results) return

    const displayName = customName || `${amperage}A @ ${voltage}V${runLength ? ` (${runLength}ft)` : ""}`

    const calc: Calculation = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      title: displayName,
      customName: customName || undefined,
      amperage,
      voltage,
      phase,
      conductorType,
      tempRating,
      includeNeutral,
      runLength,
      maxVoltageDropPercent,
      results,
    }

    setSavedCalculations((prev) => [calc, ...prev].slice(0, 20))
    setShowSaveDialog(false)
    setRunName("")
  }

  const loadCalculation = (calc: Calculation) => {
    setAmperage(calc.amperage)
    setVoltage(calc.voltage)
    setPhase(calc.phase)
    setConductorType(calc.conductorType)
    setTempRating(calc.tempRating)
    setIncludeNeutral(calc.includeNeutral)
    setRunLength(calc.runLength)
    setMaxVoltageDropPercent(calc.maxVoltageDropPercent)
    setShowHistory(false)
  }

  const resetCalculator = () => {
    setAmperage(preferences.defaultAmperage)
    setVoltage(preferences.defaultVoltage)
    setPhase(preferences.defaultPhase)
    setConductorType(preferences.defaultConductorType)
    setTempRating(preferences.defaultTempRating)
    setIncludeNeutral(false)
    setRunLength(preferences.defaultRunLength)
    setMaxVoltageDropPercent(preferences.defaultVoltageDropPercent)
    setResults(null)
  }

  const handlePreferencesChange = (newPreferences: Partial<Preferences>) => {
    setPreferences(newPreferences)
  }

  const handleResetPreferences = () => {
    resetPreferences()
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
          <AlertDescription className="text-red-700 dark:text-red-300">
            {validationErrors.join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Calculator Card */}
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-b border-indigo-100 dark:border-indigo-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-indigo-900 dark:text-indigo-100">
                  Feeder Calculator
                </CardTitle>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-0.5">
                  Calculate wire size with voltage drop optimization
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {mounted && (
                <>
                  <SettingsDialog
                    preferences={preferences}
                    onPreferencesChange={handlePreferencesChange}
                    onReset={handleResetPreferences}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="text-indigo-600 dark:text-indigo-400"
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-100 dark:bg-gray-700">
              <TabsTrigger value="calculator" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                Calculator
              </TabsTrigger>
              <TabsTrigger value="reference" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                NEC Tables
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                History ({savedCalculations.length})
              </TabsTrigger>
            </TabsList>

            {/* Calculator Tab */}
            <TabsContent value="calculator" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Input Column */}
                <div className="lg:col-span-1">
                  <CalculatorFormV3
                    amperage={amperage}
                    setAmperage={setAmperage}
                    voltage={voltage}
                    setVoltage={setVoltage}
                    phase={phase}
                    setPhase={setPhase}
                    conductorType={conductorType}
                    setConductorType={setConductorType}
                    tempRating={tempRating}
                    setTempRating={setTempRating}
                    includeNeutral={includeNeutral}
                    setIncludeNeutral={setIncludeNeutral}
                    runLength={runLength}
                    setRunLength={setRunLength}
                    maxVoltageDropPercent={maxVoltageDropPercent}
                    setMaxVoltageDropPercent={setMaxVoltageDropPercent}
                    onCalculate={handleCalculate}
                    ampsPerClick={preferences.ampsPerClick}
                    manualOverride={manualOverride}
                    setManualOverride={handleManualOverrideToggle}
                    recommendedWireSize={conductorType === "copper" ? results?.copper.wireSize : results?.aluminum.wireSize}
                    manualWireSize={manualWireSize}
                    setManualWireSize={setManualWireSize}
                    numberOfSets={numberOfSets}
                    setNumberOfSets={setNumberOfSets}
                    maxCopperWireSize={preferences.maxCopperWireSize}
                    maxAluminumWireSize={preferences.maxAluminumWireSize}
                  />
                </div>

                {/* Results Column */}
                <div className="lg:col-span-2">
                  {results ? (
                    <>
                      <ResultsGridDual
                        copper={results.copper}
                        aluminum={results.aluminum}
                        preferredType={conductorType}
                        voltage={voltage}
                        amperage={amperage}
                        phase={phase}
                      />

                      {/* Action Buttons */}
                      <div className="grid grid-cols-3 gap-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetCalculator}
                          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900"
                        >
                          Reset
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href)
                          }}
                          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                          <DialogTrigger asChild>
                            <Button
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              size="sm"
                            >
                              Save
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Save Calculation</DialogTitle>
                              <DialogDescription>
                                Give this run a custom name (optional). Leave blank for auto-generated name.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label htmlFor="runName" className="text-sm font-medium">
                                  Run Name
                                </label>
                                <input
                                  id="runName"
                                  type="text"
                                  value={runName}
                                  onChange={(e) => setRunName(e.target.value)}
                                  placeholder={`${amperage}A @ ${voltage}V${runLength ? ` (${runLength}ft)` : ""}`}
                                  className="w-full px-3 py-2 border border-indigo-200 dark:border-indigo-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      saveCalculation(runName || undefined)
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => setShowSaveDialog(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                  onClick={() => saveCalculation(runName || undefined)}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-96 rounded-lg border-2 border-dashed border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950">
                      <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                        Enter values to see results
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Reference Tab */}
            <TabsContent value="reference">
              <ReferenceTabsV3 />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              {savedCalculations.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Click a calculation to load it
                  </p>
                  {savedCalculations.map((calc) => (
                    <button
                      key={calc.id}
                      onClick={() => loadCalculation(calc)}
                      className="w-full text-left p-3 rounded-lg border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors"
                    >
                      <p className="font-semibold text-gray-900 dark:text-white">{calc.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {calc.phase === "three" ? "3-Phase" : "1-Phase"} • {calc.conductorType === "copper" ? "Cu" : "Al"} • {calc.tempRating}°C{calc.runLength ? ` • ${calc.runLength}ft` : ""} | {calc.timestamp}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No saved calculations yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4">
        <p>© 2026 Shaya Birnbaum • v3.0 • Based on NEC 2023</p>
        <p className="mt-2">
          <a href="https://wirecalc.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Classic WireCalc (v1)
          </a>
        </p>
      </div>
    </div>
  )
}
