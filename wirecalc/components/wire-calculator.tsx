"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { FileDown, RotateCcw, Share, Save, History, Sun, Moon, Settings, Zap, Plus, Minus, Printer, FileSpreadsheet } from "lucide-react"
import { calculateParallelFeeders } from "@/lib/wire-calculations"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Settings type
interface CalculatorSettings {
  ampsPerClick: number
  defaultConductorType: "copper" | "aluminum"
  defaultVoltage: number
  defaultPhase: "single" | "three"
  defaultVoltageDropPercent: number
}

const defaultSettings: CalculatorSettings = {
  ampsPerClick: 10,
  defaultConductorType: "copper",
  defaultVoltage: 208,
  defaultPhase: "three",
  defaultVoltageDropPercent: 3,
}

export function WireCalculator() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState<CalculatorSettings>(defaultSettings)
  const [showSettings, setShowSettings] = useState(false)
  
  const [amperage, setAmperage] = useState<number>(20)
  const [voltage, setVoltage] = useState<number>(208)
  const [phase, setPhase] = useState<string>("three")
  const [conductorType, setConductorType] = useState<string>("copper")
  const [temperature, setTemperature] = useState<string>("75")
  const [conduitType, setConduitType] = useState<string>("emt")
  const [conduitSize, setConduitSize] = useState<string>("3/4")
  const [wireCount, setWireCount] = useState<number>(3)
  const [includeNeutral, setIncludeNeutral] = useState<boolean>(false)
  const [includeGround, setIncludeGround] = useState<boolean>(true)
  const [runLength, setRunLength] = useState<number | null>(null)
  const [voltageDropPercent, setVoltageDropPercent] = useState<number>(3)
  const [notes, setNotes] = useState<string>("")
  const [results, setResults] = useState<any>(null)
  const calculatorRef = useRef<HTMLDivElement>(null)
  const printFrameRef = useRef<HTMLIFrameElement | null>(null)
  const [title, setTitle] = useState<string>("")
  const [savedCalculations, setSavedCalculations] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState<boolean>(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedSettings = localStorage.getItem("calculatorSettings")
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings(parsed)
      // Apply defaults from saved settings
      setConductorType(parsed.defaultConductorType)
      setVoltage(parsed.defaultVoltage)
      setPhase(parsed.defaultPhase)
      setVoltageDropPercent(parsed.defaultVoltageDropPercent)
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = (newSettings: CalculatorSettings) => {
    setSettings(newSettings)
    localStorage.setItem("calculatorSettings", JSON.stringify(newSettings))
    setShowSettings(false)
  }

  // Amperage adjustment functions
  const incrementAmperage = () => {
    setAmperage((prev) => Math.min(prev + settings.ampsPerClick, 4000))
  }
  
  const decrementAmperage = () => {
    setAmperage((prev) => Math.max(prev - settings.ampsPerClick, 1))
  }

  // Handle voltage changes and automate settings
  useEffect(() => {
    if (voltage === 120) {
      setPhase("single")
      setWireCount(1) // Just 1 hot for 120V
      setIncludeNeutral(true) // Always include neutral for 120V
    } else if (voltage === 208 && phase === "single") {
      setWireCount(2)
      // Don't reset includeNeutral here - let user control it
    }
  }, [voltage])

  // Handle phase changes and automate settings
  useEffect(() => {
    if (phase === "three") {
      setWireCount(3)
      // Don't reset includeNeutral here - let user control it
    } else if (phase === "single" && voltage === 120) {
      setWireCount(1) // Just 1 hot for 120V single phase
      setIncludeNeutral(true) // Always include neutral for 120V
    } else if (phase === "single" && voltage === 208) {
      setWireCount(2)
      // Don't reset includeNeutral here - let user control it
    }
  }, [phase, voltage])

  // Set preferred conductor type based on amperage
  useEffect(() => {
    if (amperage <= 60) {
      setConductorType("copper") // Prefer copper for loads under 60A
    }
  }, [amperage])

  useEffect(() => {
    if (amperage && voltage) {
      calculateResults()
    }
  }, [
    amperage,
    voltage,
    phase,
    conductorType,
    temperature,
    conduitType,
    wireCount,
    includeNeutral,
    runLength,
    voltageDropPercent,
  ])

  const calculateResults = () => {
    // Calculate parallel feeders (optimal when run length provided, schedule when not)
    const parallelCopper = calculateParallelFeeders(
      amperage,
      "copper",
      temperature,
      phase,
      includeNeutral,
      conduitType,
      voltage,
      false,
      voltageDropPercent,
      runLength,
    )

    const parallelAluminum = calculateParallelFeeders(
      amperage,
      "aluminum",
      temperature,
      phase,
      includeNeutral,
      conduitType,
      voltage,
      false,
      voltageDropPercent,
      runLength,
    )

    // Calculate next size up for parallel feeders (only meaningful when no run length)
    // When run length is provided, optimal sizing already handles this
    const nextSizeUpParallelCopper = calculateParallelFeeders(
      amperage,
      "copper",
      temperature,
      phase,
      includeNeutral,
      conduitType,
      voltage,
      true,
      voltageDropPercent,
      runLength ? null : runLength, // Don't pass runLength for next size up - use schedule
    )

    const nextSizeUpParallelAluminum = calculateParallelFeeders(
      amperage,
      "aluminum",
      temperature,
      phase,
      includeNeutral,
      conduitType,
      voltage,
      true,
      voltageDropPercent,
      runLength ? null : runLength, // Don't pass runLength for next size up - use schedule
    )

    setResults({
      copper: {
        parallel: parallelCopper,
        nextSizeUp: nextSizeUpParallelCopper,
      },
      aluminum: {
        parallel: parallelAluminum,
        nextSizeUp: nextSizeUpParallelAluminum,
      },
      totalConductors: parallelCopper.wiresPerSet + 1, // +1 for ground
    })
  }

  const resetCalculator = () => {
    setAmperage(20)
    setVoltage(settings.defaultVoltage)
    setPhase(settings.defaultPhase)
    setConductorType(settings.defaultConductorType)
    setTemperature("75")
    setConduitType("emt")
    setWireCount(settings.defaultPhase === "three" ? 3 : 2)
    setIncludeNeutral(false)
    setIncludeGround(true)
    setRunLength(null)
    setVoltageDropPercent(settings.defaultVoltageDropPercent)
    setNotes("")
    setTitle("")
  }

  const saveCalculation = () => {
    if (!results) return

    const calculation = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      title: title || `${amperage}A @ ${voltage}V`,
      amperage,
      voltage,
      phase,
      conductorType,
      includeNeutral,
      runLength,
      voltageDropPercent,
      results: {
        copper: results.copper.parallel,
        aluminum: results.aluminum.parallel,
      },
    }

    setSavedCalculations((prev) => {
      const updated = [calculation, ...prev].slice(0, 10) // Keep only last 10
      return updated
    })
  }

  const loadCalculation = (calc: any) => {
    setTitle(calc.title)
    setAmperage(calc.amperage)
    setVoltage(calc.voltage)
    setPhase(calc.phase)
    setConductorType(calc.conductorType)
    setIncludeNeutral(calc.includeNeutral)
    setRunLength(calc.runLength)
    setVoltageDropPercent(calc.voltageDropPercent)
    setShowHistory(false)
  }

  // Export to Excel function
  const handleExportExcel = () => {
    if (!results) return

    // Create CSV content
    const csvRows = [
      ["Electrical Feeder Calculator - Export"],
      ["Generated:", new Date().toLocaleString()],
      [""],
      ["INPUT PARAMETERS"],
      ["Feeder Name", title || "Unnamed"],
      ["Amperage", `${amperage} A`],
      ["Voltage", `${voltage} V`],
      ["Phase", phase === "three" ? "3-Phase" : "1-Phase"],
      ["Max Voltage Drop", `${voltageDropPercent}%`],
      ["Run Length", runLength ? `${runLength} ft` : "Not specified"],
      ["Include Neutral", includeNeutral ? "Yes" : "No"],
      ["Conduit Type", conduitType.toUpperCase()],
      [""],
      ["COPPER CONDUCTOR RESULTS"],
      ["Wire Size", results.copper.parallel.wireSize],
      ["Ground Size", results.copper.parallel.groundWireSize],
      ["Conduit Size", results.copper.parallel.conduitSize],
      ["Number of Sets", results.copper.parallel.sets],
      ["Max Ampacity", `${results.copper.parallel.maxAmpacity} A`],
      runLength ? ["Voltage Drop", `${results.copper.parallel.voltageDrop} V (${results.copper.parallel.voltageDropPercent}%)`] : ["Max Run Length", `${results.copper.parallel.maxLength} ft`],
      runLength ? ["Voltage at Load", `${results.copper.parallel.voltageAtLoad} V`] : [],
      [""],
      ["ALUMINUM CONDUCTOR RESULTS"],
      ["Wire Size", results.aluminum.parallel.wireSize],
      ["Ground Size", results.aluminum.parallel.groundWireSize],
      ["Conduit Size", results.aluminum.parallel.conduitSize],
      ["Number of Sets", results.aluminum.parallel.sets],
      ["Max Ampacity", `${results.aluminum.parallel.maxAmpacity} A`],
      runLength ? ["Voltage Drop", `${results.aluminum.parallel.voltageDrop} V (${results.aluminum.parallel.voltageDropPercent}%)`] : ["Max Run Length", `${results.aluminum.parallel.maxLength} ft`],
      runLength ? ["Voltage at Load", `${results.aluminum.parallel.voltageAtLoad} V`] : [],
    ].filter(row => row.length > 0)

    const csvContent = csvRows.map(row => row.join(",")).join("\n")
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `feeder-calc-${title || "export"}-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Improved share function
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Electrical Feeder Calculator",
          text: title || "Wire and Conduit Calculation Results",
          url: window.location.href,
        })
      } else {
        // Fallback for browsers that don't support the Web Share API
        const url = window.location.href
        await navigator.clipboard.writeText(url)
        alert("Link copied to clipboard!")
      }
    } catch (error) {
      console.error("Error sharing:", error)
    }
  }

  // Update the export function to better match the site appearance
  const handleExportPDF = () => {
    // Create a printable version and trigger browser print dialog
    if (!printFrameRef.current) {
      printFrameRef.current = document.createElement("iframe")
      printFrameRef.current.style.position = "absolute"
      printFrameRef.current.style.top = "-9999px"
      document.body.appendChild(printFrameRef.current)
    }

    const iframe = printFrameRef.current
    const doc = iframe.contentDocument || iframe.contentWindow?.document

    if (doc) {
      doc.open()
      doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || "Electrical Feeder Calculator Results"}</title>
          <style>
            @page {
              size: 8.5in 11in;
              margin: 0.5in;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
              line-height: 1.5;
            }
            .container {
              max-width: 7.5in;
              margin: 0 auto;
            }
            h1 {
              font-size: 18px;
              margin-bottom: 5px;
              color: #333;
              text-align: center;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
              text-align: center;
              margin-top: 0;
              margin-bottom: 15px;
            }
            h2 {
              font-size: 16px;
              margin-top: 15px;
              margin-bottom: 10px;
              color: #444;
            }
            h3 {
              font-size: 14px;
              margin-top: 10px;
              margin-bottom: 5px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ddd;
            }
            .project-title {
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 15px;
              padding: 5px;
              border: 1px solid #ddd;
              background-color: #f9f9f9;
              border-radius: 4px;
            }
            .section {
              margin-bottom: 15px;
            }
            .result-box {
              border: 1px solid #ddd;
              padding: 10px;
              margin-bottom: 10px;
              border-radius: 5px;
              background-color: #f9f9f9;
            }
            .result-box.primary {
              background-color: #f0f7ff;
              border-color: #cce5ff;
            }
            .result-box.secondary {
              background-color: #f0fff5;
              border-color: #ccffe0;
            }
            .parameters {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .parameter {
              margin-bottom: 5px;
            }
            .parameter-label {
              font-weight: bold;
            }
            .notes {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
              text-align: center;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            p {
              margin: 5px 0;
            }
            .voltage-info {
              margin-top: 5px;
              font-style: italic;
              color: #555;
            }
            .conduit-info {
              background-color: #f0f7ff;
              border: 1px solid #cce5ff;
              border-radius: 5px;
              padding: 10px;
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Electrical Feeder Calculator</h1>
              <p class="subtitle">v2.0-Beta</p>
              ${title ? `<div class="project-title">${title}</div>` : ""}
            </div>
            
            <div class="section">
              <h2>Input Parameters</h2>
              <div class="parameters">
                <div class="parameter">
                  <span class="parameter-label">Amperage:</span> ${amperage} A
                </div>
                <div class="parameter">
                  <span class="parameter-label">Voltage:</span> ${voltage} V
                </div>
                <div class="parameter">
                  <span class="parameter-label">Phase:</span> ${phase === "single" ? "Single Phase" : "Three Phase"}
                </div>
                <div class="parameter">
                  <span class="parameter-label">Conductor Type:</span> ${conductorType === "copper" ? "Copper" : "Aluminum"}
                </div>
                <div class="parameter">
                  <span class="parameter-label">Temperature Rating:</span> ${temperature}°C
                </div>
                <div class="parameter">
                  <span class="parameter-label">Conduit Type:</span> ${conduitType.toUpperCase()}
                </div>
                <div class="parameter">
                  <span class="parameter-label">Number of Conductors:</span> ${wireCount}
                </div>
                <div class="parameter">
                  <span class="parameter-label">Include Neutral:</span> ${includeNeutral ? "Yes" : "No"}
                </div>
                <div class="parameter">
                  <span class="parameter-label">Voltage Drop %:</span> ${voltageDropPercent}%
                </div>
                ${
                  runLength
                    ? `
                <div class="parameter">
                  <span class="parameter-label">Run Length:</span> ${runLength} feet
                </div>
                `
                    : ""
                }
              </div>
            </div>
            
            ${
              results
                ? `
            <div class="section">
              <h2>${conductorType === "copper" ? "Copper" : "Aluminum"} Conductor (Preferred)</h2>
              <div class="result-box primary">
                <h3>Recommended Configuration</h3>
                <p>${results[conductorType].parallel.sets}-sets of (${results[conductorType].parallel.wiresPerSet}) ${results[conductorType].parallel.wireSize} + (1) ${results[conductorType].parallel.groundWireSize} Ground, in ${results[conductorType].parallel.conduitSize} Conduit</p>
                <p><span class="parameter-label">Max Ampacity:</span> ${results[conductorType].parallel.maxAmpacity} A per set</p>
                ${
                  runLength
                    ? `
                <p>Run Length: ${runLength} feet</p>
                <div class="voltage-info">
                  <p>Voltage at Load: ${results[conductorType].parallel.voltageAtLoad} V</p>
                  <p>Voltage Drop: ${results[conductorType].parallel.voltageDrop} V (${results[conductorType].parallel.voltageDropPercent}%)</p>
                </div>
                `
                    : `
                <p>Maximum Run Length: ${results[conductorType].parallel.maxLength} feet</p>
                `
                }
                <p>Per NEC 310.10(H) & 310.4</p>
              </div>
              
              <div class="result-box secondary">
                <h3>Next Size Up</h3>
                <p>${results[conductorType].nextSizeUp.sets}-sets of (${results[conductorType].nextSizeUp.wiresPerSet}) ${results[conductorType].nextSizeUp.wireSize} + (1) ${results[conductorType].nextSizeUp.groundWireSize} Ground, in ${results[conductorType].nextSizeUp.conduitSize} Conduit</p>
                <p><span class="parameter-label">Max Ampacity:</span> ${results[conductorType].nextSizeUp.maxAmpacity} A per set</p>
                ${
                  runLength
                    ? `
                <p>Run Length: ${runLength} feet</p>
                <div class="voltage-info">
                  <p>Voltage at Load: ${results[conductorType].nextSizeUp.voltageAtLoad} V</p>
                  <p>Voltage Drop: ${results[conductorType].nextSizeUp.voltageDrop} V (${results[conductorType].nextSizeUp.voltageDropPercent}%)</p>
                </div>
                `
                    : `
                <p>Maximum Run Length: ${results[conductorType].nextSizeUp.maxLength} feet</p>
                `
                }
              </div>
            </div>
            
            <div class="section">
              <h2>${conductorType === "copper" ? "Aluminum" : "Copper"} Conductor (Alternative)</h2>
              <div class="result-box primary">
                <h3>Recommended Configuration</h3>
                <p>${results[conductorType === "copper" ? "aluminum" : "copper"].parallel.sets}-sets of (${results[conductorType === "copper" ? "aluminum" : "copper"].parallel.wiresPerSet}) ${results[conductorType === "copper" ? "aluminum" : "copper"].parallel.wireSize} + (1) ${results[conductorType === "copper" ? "aluminum" : "copper"].parallel.groundWireSize} Ground, in ${results[conductorType === "copper" ? "aluminum" : "copper"].parallel.conduitSize} Conduit</p>
                <p><span class="parameter-label">Max Ampacity:</span> ${results[conductorType === "copper" ? "aluminum" : "copper"].parallel.maxAmpacity} A per set</p>
                ${
                  runLength
                    ? `
                <p>Run Length: ${runLength} feet</p>
                <div class="voltage-info">
                  <p>Voltage at Load: ${results[conductorType === "copper" ? "aluminum" : "copper"].parallel.voltageAtLoad} V</p>
                  <p>Voltage Drop: ${results[conductorType === "copper" ? "aluminum" : "copper"].parallel.voltageDrop} V (${results[conductorType === "copper" ? "aluminum" : "copper"].parallel.voltageDropPercent}%)</p>
                </div>
                `
                    : `
                <p>Maximum Run Length: ${results[conductorType === "copper" ? "aluminum" : "copper"].parallel.maxLength} feet</p>
                `
                }
                <p>Per NEC 310.10(H) & 310.4</p>
              </div>
              
              <div class="result-box secondary">
                <h3>Next Size Up</h3>
                <p>${results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.sets}-sets of (${results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.wiresPerSet}) ${results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.wireSize} + (1) ${results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.groundWireSize} Ground, in ${results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.conduitSize} Conduit</p>
                <p><span class="parameter-label">Max Ampacity:</span> ${results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.maxAmpacity} A per set</p>
                ${
                  runLength
                    ? `
                <p>Run Length: ${runLength} feet</p>
                <div class="voltage-info">
                  <p>Voltage at Load: ${results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.voltageAtLoad} V</p>
                  <p>Voltage Drop: ${results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.voltageDrop} V (${results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.voltageDropPercent}%)</p>
                </div>
                `
                    : `
                <p>Maximum Run Length: ${results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.maxLength} feet</p>
                `
                }
              </div>
            </div>
            
            <div class="section">
              <div class="conduit-info">
                <h3>Conduit Information</h3>
                <p><span class="parameter-label">Total Conductors Per Conduit:</span> ${results.totalConductors} ${includeNeutral ? "(including neutral)" : ""} (including ground)</p>
                <p><span class="parameter-label">Conduit Type:</span> ${conduitType.toUpperCase()}</p>
                <p><span class="parameter-label">Based on NEC Table C.1 for ${conduitType.toUpperCase()}</span></p>
              </div>
            </div>
            `
                : ""
            }
            
            ${
              notes
                ? `
            <div class="notes">
              <h2>Notes</h2>
              <p>${notes.replace(/\n/g, "<br>")}</p>
            </div>
            `
                : ""
            }
            
            <div class="footer">
              <p>© 2026 Shaya Birnbaum. v2.0-Beta</p>
            </div>
          </div>
        </body>
      </html>
    `)
      doc.close()

      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      }, 500)
    }
  }

  return (
    <Card className="overflow-hidden border-none bg-card shadow-lg dark:border dark:border-border" ref={calculatorRef}>
      <CardHeader className="bg-gradient-to-b from-blue-50 to-card dark:from-blue-950 dark:to-card pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-blue-800 dark:text-blue-200">
                Electrical Feeder Calculator <span className="text-sm font-normal text-blue-500 dark:text-blue-400">v2.0-Beta</span>
              </CardTitle>
              <CardDescription className="text-blue-600 dark:text-blue-400">
                Calculate appropriate wire and conduit sizes based on electrical requirements
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Calculator Settings</DialogTitle>
                  <DialogDescription>
                    Configure default values for the calculator
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Amps per Click</Label>
                    <Select
                      value={String(settings.ampsPerClick)}
                      onValueChange={(value) => setSettings({ ...settings, ampsPerClick: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Amp</SelectItem>
                        <SelectItem value="5">5 Amps</SelectItem>
                        <SelectItem value="10">10 Amps</SelectItem>
                        <SelectItem value="20">20 Amps</SelectItem>
                        <SelectItem value="50">50 Amps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Conductor Type</Label>
                    <Select
                      value={settings.defaultConductorType}
                      onValueChange={(value: "copper" | "aluminum") => setSettings({ ...settings, defaultConductorType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="copper">Copper</SelectItem>
                        <SelectItem value="aluminum">Aluminum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Voltage</Label>
                    <Select
                      value={String(settings.defaultVoltage)}
                      onValueChange={(value) => setSettings({ ...settings, defaultVoltage: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="120">120V</SelectItem>
                        <SelectItem value="208">208V</SelectItem>
                        <SelectItem value="240">240V</SelectItem>
                        <SelectItem value="277">277V</SelectItem>
                        <SelectItem value="480">480V</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Phase</Label>
                    <Select
                      value={settings.defaultPhase}
                      onValueChange={(value: "single" | "three") => setSettings({ ...settings, defaultPhase: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Phase</SelectItem>
                        <SelectItem value="three">Three Phase</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Voltage Drop %</Label>
                    <Select
                      value={String(settings.defaultVoltageDropPercent)}
                      onValueChange={(value) => setSettings({ ...settings, defaultVoltageDropPercent: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1%</SelectItem>
                        <SelectItem value="2">2%</SelectItem>
                        <SelectItem value="3">3%</SelectItem>
                        <SelectItem value="4">4%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
                  <Button onClick={() => saveSettings(settings)} className="bg-blue-600 hover:bg-blue-700">Save Settings</Button>
                </div>
              </DialogContent>
            </Dialog>
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="reference">Feeder Reference</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left column - Inputs */}
              <div className="space-y-6">
                <div className="mb-6">
                  <Label htmlFor="title" className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Feeder Name (optional)
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter feeder name (optional)"
                    className="mt-1 font-medium text-lg border-blue-200 dark:border-blue-600 focus:border-blue-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amperage" className="text-blue-700 dark:text-blue-300">
                    Amperage
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decrementAmperage}
                      className="h-10 w-10 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900 bg-transparent"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      id="amperage-input"
                      value={amperage}
                      onChange={(e) => setAmperage(Math.max(1, Math.min(4000, Number(e.target.value))))}
                      className="text-center text-lg font-semibold border-blue-200 dark:border-blue-600"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={incrementAmperage}
                      className="h-10 w-10 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900 bg-transparent"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Click arrows to adjust by {settings.ampsPerClick}A</p>
                </div>

                {/* Conductor type toggle buttons */}
                <div className="space-y-2">
                  <Label className="text-blue-700 dark:text-blue-300">Preferred Conductor</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={conductorType === "copper" ? "default" : "outline"}
                      className={`flex-1 ${conductorType === "copper" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300 bg-transparent"}`}
                      onClick={() => setConductorType("copper")}
                    >
                      Copper
                    </Button>
                    <Button
                      variant={conductorType === "aluminum" ? "default" : "outline"}
                      className={`flex-1 ${conductorType === "aluminum" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300 bg-transparent"}`}
                      onClick={() => setConductorType("aluminum")}
                    >
                      Aluminum
                    </Button>
                  </div>
                </div>

                {/* Voltage buttons */}
                <div className="space-y-2">
                  <Label className="text-blue-700 dark:text-blue-300">Voltage</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[120, 208, 240, 277, 480, 600].map((v) => (
                      <Button
                        key={v}
                        variant={voltage === v ? "default" : "outline"}
                        className={`${voltage === v ? "bg-blue-600 hover:bg-blue-700" : "border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300 bg-transparent"}`}
                        onClick={() => setVoltage(v)}
                        size="sm"
                      >
                        {v}V
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phase" className="text-blue-700 dark:text-blue-300">
                      Phase
                    </Label>
                    <Select value={phase} onValueChange={setPhase}>
                      <SelectTrigger id="phase" className="border-blue-200 dark:border-blue-600">
                        <SelectValue placeholder="Select phase" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Phase</SelectItem>
                        <SelectItem value="three">Three Phase</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature" className="text-blue-700 dark:text-blue-300">
                      Temperature Rating
                    </Label>
                    <Select value={temperature} onValueChange={setTemperature}>
                      <SelectTrigger id="temperature" className="border-blue-200 dark:border-blue-600">
                        <SelectValue placeholder="Select temperature" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">60°C</SelectItem>
                        <SelectItem value="75">75°C</SelectItem>
                        <SelectItem value="90">90°C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {voltage !== 120 && (
                  <div className="flex items-center space-x-2">
                    <Switch id="includeNeutral" checked={includeNeutral} onCheckedChange={setIncludeNeutral} />
                    <Label htmlFor="includeNeutral" className="text-blue-700 dark:text-blue-300">
                      Include Neutral Wire
                    </Label>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-blue-700 dark:text-blue-300">Voltage Drop Percentage</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((percent) => (
                      <Button
                        key={percent}
                        variant={voltageDropPercent === percent ? "default" : "outline"}
                        className={`flex-1 ${voltageDropPercent === percent ? "bg-blue-600 hover:bg-blue-700" : "border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300 bg-transparent"}`}
                        onClick={() => setVoltageDropPercent(percent)}
                        size="sm"
                      >
                        {percent}%
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="runLength" className="text-blue-700 dark:text-blue-300">
                    Run Length (feet)
                  </Label>
                  <Input
                    type="number"
                    id="runLength"
                    value={runLength === null ? "" : runLength}
                    onChange={(e) => setRunLength(e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="Optional - enter for optimal wire sizing"
                    min={0}
                    className="border-blue-200 dark:border-blue-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conduit" className="text-blue-700 dark:text-blue-300">
                    Conduit Type
                  </Label>
                  <Select value={conduitType} onValueChange={setConduitType}>
                    <SelectTrigger id="conduit" className="border-blue-200 dark:border-blue-600">
                      <SelectValue placeholder="Select conduit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emt">EMT</SelectItem>
                      <SelectItem value="pvc">PVC</SelectItem>
                      <SelectItem value="rigid">Rigid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-blue-700 dark:text-blue-300">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes here..."
                    className="min-h-[100px] border-blue-200 dark:border-blue-600"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900 bg-transparent"
                    onClick={resetCalculator}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    className="w-12 gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900 bg-transparent"
                    onClick={handleShare}
                  >
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900 bg-transparent"
                    onClick={handleExportPDF}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900 bg-transparent"
                    onClick={handleExportExcel}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={saveCalculation}
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex-1 gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900 bg-transparent ${savedCalculations.length > 0 ? "" : "opacity-50"}`}
                    onClick={() => setShowHistory(!showHistory)}
                    disabled={savedCalculations.length === 0}
                  >
                    <History className="h-4 w-4" />
                    History ({savedCalculations.length})
                  </Button>
                </div>

                {showHistory && savedCalculations.length > 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-950 p-3 space-y-2">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm">Saved Calculations (Last 10)</h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {savedCalculations.map((calc) => (
                        <button
                          key={calc.id}
                          type="button"
                          className="w-full text-left p-2 rounded bg-white hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 border border-blue-100 dark:border-blue-700 transition-colors"
                          onClick={() => loadCalculation(calc)}
                        >
                          <p className="font-medium text-blue-800 dark:text-blue-200 text-sm">{calc.title}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            {calc.phase === "three" ? "3-Phase" : "1-Phase"} | {calc.conductorType === "copper" ? "Cu" : "Al"} | {calc.timestamp}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column - Results */}
              <div className="space-y-6">
                {results ? (
                  <>
                    {/* Optimal Recommendation Banner when run length is entered */}
                    {runLength !== null && runLength > 0 && (
                      <div className="rounded-lg bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 p-4 text-white">
                        <h3 className="text-lg font-semibold mb-2">Optimal Wire Size for {runLength} ft Run</h3>
                        <p className="text-sm opacity-90 mb-3">
                          Sized to meet {voltageDropPercent}% max voltage drop at {amperage}A, {voltage}V {phase === "three" ? "3-Phase" : "1-Phase"}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/20 rounded-lg p-3">
                            <p className="text-xs font-medium opacity-80">Copper</p>
                            <p className="font-bold">{results.copper.parallel.wireSize}</p>
                            <p className="text-xs">{results.copper.parallel.sets} set(s) in {results.copper.parallel.conduitSize}</p>
                            <p className="text-xs mt-1">VD: {results.copper.parallel.voltageDropPercent}%</p>
                          </div>
                          <div className="bg-white/20 rounded-lg p-3">
                            <p className="text-xs font-medium opacity-80">Aluminum</p>
                            <p className="font-bold">{results.aluminum.parallel.wireSize}</p>
                            <p className="text-xs">{results.aluminum.parallel.sets} set(s) in {results.aluminum.parallel.conduitSize}</p>
                            <p className="text-xs mt-1">VD: {results.aluminum.parallel.voltageDropPercent}%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show preferred conductor first */}
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-100 dark:border-blue-800">
                      <h3 className="mb-4 text-lg font-medium text-blue-800 dark:text-blue-200">
                        {conductorType === "copper" ? "Copper" : "Aluminum"} Conductor {runLength ? "(Optimal for Run Length)" : "(Preferred)"}
                      </h3>
                      <div className="space-y-4">
                        <div className="rounded-md bg-blue-100 dark:bg-blue-900 p-3 border border-blue-200 dark:border-blue-700">
                          <p className="font-medium text-blue-800 dark:text-blue-200">
                            {runLength ? "Optimal Configuration" : "Recommended Configuration"}
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {results[conductorType].parallel.sets}-sets of (
                            {results[conductorType].parallel.wiresPerSet}) {results[conductorType].parallel.wireSize} +
                            (1) {results[conductorType].parallel.groundWireSize} Ground, in{" "}
                            {results[conductorType].parallel.conduitSize} Conduit
                          </p>
                          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                            <span className="font-medium">Max Ampacity:</span>{" "}
                            {results[conductorType].parallel.sets > 1
                              ? `${results[conductorType].parallel.maxAmpacity * results[conductorType].parallel.sets} A (${results[conductorType].parallel.maxAmpacity} A per set)`
                              : `${results[conductorType].parallel.maxAmpacity} A`}
                          </p>
                          {runLength !== null ? (
                            <>
                              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">Run Length: {runLength} feet</p>
                              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                Voltage at Load: {results[conductorType].parallel.voltageAtLoad} V
                              </p>
                              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                Voltage Drop: {results[conductorType].parallel.voltageDrop} V (
                                {results[conductorType].parallel.voltageDropPercent}%)
                              </p>
                            </>
                          ) : (
                            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                              Maximum Run Length: {results[conductorType].parallel.maxLength} feet
                            </p>
                          )}
                          <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">Per NEC 310.10(H) & 310.4</p>
                        </div>

                        {/* Only show Next Size Up when no run length is specified */}
                        {!runLength && (
                          <div className="rounded-md bg-green-100 dark:bg-green-900 p-3 border border-green-200 dark:border-green-700">
                            <p className="font-medium text-green-800 dark:text-green-200">Next Size Up</p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {results[conductorType].nextSizeUp.sets}-sets of (
                              {results[conductorType].nextSizeUp.wiresPerSet}){" "}
                              {results[conductorType].nextSizeUp.wireSize} + (1){" "}
                              {results[conductorType].nextSizeUp.groundWireSize} Ground, in{" "}
                              {results[conductorType].nextSizeUp.conduitSize} Conduit
                            </p>
                            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                              <span className="font-medium">Max Ampacity:</span>{" "}
                              {results[conductorType].nextSizeUp.sets > 1
                                ? `${results[conductorType].nextSizeUp.maxAmpacity * results[conductorType].nextSizeUp.sets} A (${results[conductorType].nextSizeUp.maxAmpacity} A per set)`
                                : `${results[conductorType].nextSizeUp.maxAmpacity} A`}
                            </p>
                            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                              Maximum Run Length: {results[conductorType].nextSizeUp.maxLength} feet
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Show alternative conductor second */}
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700">
                      <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-gray-200">
                        {conductorType === "copper" ? "Aluminum" : "Copper"} Conductor {runLength ? "(Optimal for Run Length)" : "(Alternative)"}
                      </h3>
                      <div className="space-y-4">
                        <div className="rounded-md bg-blue-50 dark:bg-blue-900/50 p-3 border border-blue-100 dark:border-blue-800">
                          <p className="font-medium text-blue-800 dark:text-blue-200">
                            {runLength ? "Optimal Configuration" : "Recommended Configuration"}
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {results[conductorType === "copper" ? "aluminum" : "copper"].parallel.sets}-sets of (
                            {results[conductorType === "copper" ? "aluminum" : "copper"].parallel.wiresPerSet}){" "}
                            {results[conductorType === "copper" ? "aluminum" : "copper"].parallel.wireSize} + (1){" "}
                            {results[conductorType === "copper" ? "aluminum" : "copper"].parallel.groundWireSize}{" "}
                            Ground, in{" "}
                            {results[conductorType === "copper" ? "aluminum" : "copper"].parallel.conduitSize} Conduit
                          </p>
                          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                            <span className="font-medium">Max Ampacity:</span>{" "}
                            {results[conductorType === "copper" ? "aluminum" : "copper"].parallel.sets > 1
                              ? `${results[conductorType === "copper" ? "aluminum" : "copper"].parallel.maxAmpacity * results[conductorType === "copper" ? "aluminum" : "copper"].parallel.sets} A (${results[conductorType === "copper" ? "aluminum" : "copper"].parallel.maxAmpacity} A per set)`
                              : `${results[conductorType === "copper" ? "aluminum" : "copper"].parallel.maxAmpacity} A`}
                          </p>
                          {runLength !== null ? (
                            <>
                              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">Run Length: {runLength} feet</p>
                              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                Voltage at Load:{" "}
                                {results[conductorType === "copper" ? "aluminum" : "copper"].parallel.voltageAtLoad} V
                              </p>
                              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                Voltage Drop:{" "}
                                {results[conductorType === "copper" ? "aluminum" : "copper"].parallel.voltageDrop} V (
                                {
                                  results[conductorType === "copper" ? "aluminum" : "copper"].parallel
                                    .voltageDropPercent
                                }
                                %)
                              </p>
                            </>
                          ) : (
                            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                              Maximum Run Length:{" "}
                              {results[conductorType === "copper" ? "aluminum" : "copper"].parallel.maxLength} feet
                            </p>
                          )}
                          <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">Per NEC 310.10(H) & 310.4</p>
                        </div>

                        {/* Only show Next Size Up when no run length is specified */}
                        {!runLength && (
                          <div className="rounded-md bg-green-50 dark:bg-green-900/50 p-3 border border-green-100 dark:border-green-800">
                            <p className="font-medium text-green-800 dark:text-green-200">Next Size Up</p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.sets}-sets of (
                              {results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.wiresPerSet}){" "}
                              {results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.wireSize} + (1){" "}
                              {results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.groundWireSize}{" "}
                              Ground, in{" "}
                              {results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.conduitSize} Conduit
                            </p>
                            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                              <span className="font-medium">Max Ampacity:</span>{" "}
                              {results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.sets > 1
                                ? `${results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.maxAmpacity * results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.sets} A (${results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.maxAmpacity} A per set)`
                                : `${results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.maxAmpacity} A`}
                            </p>
                            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                              Maximum Run Length:{" "}
                              {results[conductorType === "copper" ? "aluminum" : "copper"].nextSizeUp.maxLength} feet
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-100 dark:border-blue-800">
                      <h3 className="mb-4 text-lg font-medium text-blue-700 dark:text-blue-300">Conduit Information</h3>
                      <div className="space-y-3">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <span className="font-medium">Total Conductors Per Conduit:</span> {results.totalConductors}
                          {includeNeutral ? " (including neutral)" : ""}
                          {" (including ground)"}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <span className="font-medium">Conduit Type:</span> {conduitType.toUpperCase()}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <span className="font-medium">Based on NEC Table C.1 for {conduitType.toUpperCase()}</span>
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-100 dark:border-blue-800">
                    <p className="text-blue-500 dark:text-blue-400">Enter values to see results</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reference">
            <div className="bg-card p-4 rounded-lg border border-border">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">Feeder Reference Sheet</h3>
              <div className="overflow-auto max-h-[600px]">
                <div className="text-xs font-mono">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                      <thead>
                        <tr className="bg-blue-100 dark:bg-blue-900">
                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center dark:text-blue-200" colSpan={6}>
                            FEEDER SCHEDULE
                          </th>
                        </tr>
                        <tr className="bg-blue-50 dark:bg-blue-950">
                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 dark:text-blue-200">TAG</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 dark:text-blue-200">OCPD AMPS</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 dark:text-blue-200">COPPER</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 dark:text-blue-200">ALUMINUM</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 dark:text-blue-200">TAG</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 dark:text-blue-200">OCPD AMPS</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F20</td>
                          <td className="border border-gray-300 px-2 py-1">20</td>
                          <td className="border border-gray-300 px-2 py-1">3 #12, 1#12 G, 3/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #10, 1#10 G, 3/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">F125</td>
                          <td className="border border-gray-300 px-2 py-1">125</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F20N</td>
                          <td className="border border-gray-300 px-2 py-1">20</td>
                          <td className="border border-gray-300 px-2 py-1">4 #12, 1#12 G, 3/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #10, 1#10 G, 3/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">F125N</td>
                          <td className="border border-gray-300 px-2 py-1">125</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F30</td>
                          <td className="border border-gray-300 px-2 py-1">30</td>
                          <td className="border border-gray-300 px-2 py-1">3 #10, 1#10 G, 3/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #8, 1#10 G, 1" C</td>
                          <td className="border border-gray-300 px-2 py-1">F150</td>
                          <td className="border border-gray-300 px-2 py-1">150</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F30N</td>
                          <td className="border border-gray-300 px-2 py-1">30</td>
                          <td className="border border-gray-300 px-2 py-1">4 #10, 1#10 G, 3/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #8, 1#10 G, 1" C</td>
                          <td className="border border-gray-300 px-2 py-1">F150N</td>
                          <td className="border border-gray-300 px-2 py-1">150</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F40</td>
                          <td className="border border-gray-300 px-2 py-1">40</td>
                          <td className="border border-gray-300 px-2 py-1">3 #8, 1#10 G, 1" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #6, 1#10 G, 1" C</td>
                          <td className="border border-gray-300 px-2 py-1">F175</td>
                          <td className="border border-gray-300 px-2 py-1">175</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F40N</td>
                          <td className="border border-gray-300 px-2 py-1">40</td>
                          <td className="border border-gray-300 px-2 py-1">4 #8, 1#10 G, 1" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #6, 1#10 G, 1" C</td>
                          <td className="border border-gray-300 px-2 py-1">F175N</td>
                          <td className="border border-gray-300 px-2 py-1">175</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F45</td>
                          <td className="border border-gray-300 px-2 py-1">45</td>
                          <td className="border border-gray-300 px-2 py-1">3 #6, 1#10 G, 1" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #6, 1#10 G, 1" C</td>
                          <td className="border border-gray-300 px-2 py-1">F200</td>
                          <td className="border border-gray-300 px-2 py-1">200</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F45N</td>
                          <td className="border border-gray-300 px-2 py-1">45</td>
                          <td className="border border-gray-300 px-2 py-1">4 #6, 1#10 G, 1" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #6, 1#10 G, 1" C</td>
                          <td className="border border-gray-300 px-2 py-1">F200N</td>
                          <td className="border border-gray-300 px-2 py-1">200</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F50</td>
                          <td className="border border-gray-300 px-2 py-1">50</td>
                          <td className="border border-gray-300 px-2 py-1">3 #6, 1#10 G, 1" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #4, 1#10 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">F225</td>
                          <td className="border border-gray-300 px-2 py-1">225</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F50N</td>
                          <td className="border border-gray-300 px-2 py-1">50</td>
                          <td className="border border-gray-300 px-2 py-1">4 #6, 1#10 G, 1" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #4, 1#10 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">F225N</td>
                          <td className="border border-gray-300 px-2 py-1">225</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F60</td>
                          <td className="border border-gray-300 px-2 py-1">60</td>
                          <td className="border border-gray-300 px-2 py-1">3 #4, 1#10 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #3, 1#8 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">F250</td>
                          <td className="border border-gray-300 px-2 py-1">250</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F60N</td>
                          <td className="border border-gray-300 px-2 py-1">60</td>
                          <td className="border border-gray-300 px-2 py-1">4 #4, 1#10 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #3, 1#8 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">F250N</td>
                          <td className="border border-gray-300 px-2 py-1">250</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F70</td>
                          <td className="border border-gray-300 px-2 py-1">70</td>
                          <td className="border border-gray-300 px-2 py-1">3 #4, 1#8 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #2, 1#8 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">F300</td>
                          <td className="border border-gray-300 px-2 py-1">300</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F70N</td>
                          <td className="border border-gray-300 px-2 py-1">70</td>
                          <td className="border border-gray-300 px-2 py-1">4 #4, 1#8 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #2, 1#8 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">F300N</td>
                          <td className="border border-gray-300 px-2 py-1">300</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F80</td>
                          <td className="border border-gray-300 px-2 py-1">80</td>
                          <td className="border border-gray-300 px-2 py-1">3 #3, 1#8 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #1, 1#8 G, 1-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F350</td>
                          <td className="border border-gray-300 px-2 py-1">350</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F80N</td>
                          <td className="border border-gray-300 px-2 py-1">80</td>
                          <td className="border border-gray-300 px-2 py-1">4 #3, 1#8 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #1, 1#8 G, 1-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F350N</td>
                          <td className="border border-gray-300 px-2 py-1">350</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F90</td>
                          <td className="border border-gray-300 px-2 py-1">90</td>
                          <td className="border border-gray-300 px-2 py-1">3 #2, 1#8 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #1/0, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F400</td>
                          <td className="border border-gray-300 px-2 py-1">400</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F90N</td>
                          <td className="border border-gray-300 px-2 py-1">90</td>
                          <td className="border border-gray-300 px-2 py-1">4 #2, 1#8 G, 1-1/4" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #1/0, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F400N</td>
                          <td className="border border-gray-300 px-2 py-1">400</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F100</td>
                          <td className="border border-gray-300 px-2 py-1">100</td>
                          <td className="border border-gray-300 px-2 py-1">3 #1, 1#8 G, 1-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #2/0, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F450</td>
                          <td className="border border-gray-300 px-2 py-1">450</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F100N</td>
                          <td className="border border-gray-300 px-2 py-1">100</td>
                          <td className="border border-gray-300 px-2 py-1">4 #1, 1#8 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #2/0, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F450N</td>
                          <td className="border border-gray-300 px-2 py-1">450</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F110</td>
                          <td className="border border-gray-300 px-2 py-1">110</td>
                          <td className="border border-gray-300 px-2 py-1">3 #1, 1#6 G, 1-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #1/0, 1#4 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F500</td>
                          <td className="border border-gray-300 px-2 py-1">500</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">F110N</td>
                          <td className="border border-gray-300 px-2 py-1">110</td>
                          <td className="border border-gray-300 px-2 py-1">4 #1, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #1/0, 1#4 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F500N</td>
                          <td className="border border-gray-300 px-2 py-1">500</td>
                        </tr>
                      </tbody>
                    </table>

                    <table className="min-w-full border-collapse border border-gray-300 mt-4">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="border border-gray-300 px-2 py-1">COPPER</th>
                          <th className="border border-gray-300 px-2 py-1">ALUMINUM</th>
                          <th className="border border-gray-300 px-2 py-1">TAG</th>
                          <th className="border border-gray-300 px-2 py-1">OCPD AMPS</th>
                          <th className="border border-gray-300 px-2 py-1">COPPER</th>
                          <th className="border border-gray-300 px-2 py-1">ALUMINUM</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">3 #1, 1#6 G, 1-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #2/0, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F600</td>
                          <td className="border border-gray-300 px-2 py-1">600</td>
                          <td className="border border-gray-300 px-2 py-1">3 #350KCMIL, 1#1 G, 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #500KCMIL, 1#2/0 G, 3" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">4 #1, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #2/0, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F600N</td>
                          <td className="border border-gray-300 px-2 py-1">600</td>
                          <td className="border border-gray-300 px-2 py-1">4 #350KCMIL, 1#1 G, 3" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #500KCMIL, 1#2/0 G, 3-1/2" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">3 #1/0, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #3/0, 1#4 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F700</td>
                          <td className="border border-gray-300 px-2 py-1">700</td>
                          <td className="border border-gray-300 px-2 py-1">3 #500KCMIL, 1#1/0 G, 3" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #700KCMIL, 1#3/0 G, 3-1/2" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">4 #1/0, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #3/0, 1#4 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F700N</td>
                          <td className="border border-gray-300 px-2 py-1">700</td>
                          <td className="border border-gray-300 px-2 py-1">4 #500KCMIL, 1#1/0 G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #700KCMIL, 1#3/0 G, 4" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">3 #2/0, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #4/0, 1#4 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F800</td>
                          <td className="border border-gray-300 px-2 py-1">800</td>
                          <td className="border border-gray-300 px-2 py-1">3 #600KCMIL, 1#1/0 G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #400KCMIL, 1#3/0 G, 3" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">4 #2/0, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #4/0, 1#4 G, 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F800N</td>
                          <td className="border border-gray-300 px-2 py-1">800</td>
                          <td className="border border-gray-300 px-2 py-1">4 #600KCMIL, 1#1/0 G, 4" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #400KCMIL, 1#3/0 G, 3" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">3 #3/0, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #250KCMIL, 1#4 G, 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F1000</td>
                          <td className="border border-gray-300 px-2 py-1">1000</td>
                          <td className="border border-gray-300 px-2 py-1">3 #400KCMIL, 1#2/0 G, 3" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #600KCMIL, 1#4/0 G, 3-1/2" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">4 #3/0, 1#6 G, 2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #250KCMIL, 1#4 G, 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F1000N</td>
                          <td className="border border-gray-300 px-2 py-1">1000</td>
                          <td className="border border-gray-300 px-2 py-1">4 #400KCMIL, 1#2/0 G, 3" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #600KCMIL, 1#4/0 G, 4" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">3 #4/0, 1#4 G, 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #300KCMIL, 1#2 G, 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F1200</td>
                          <td className="border border-gray-300 px-2 py-1">1200</td>
                          <td className="border border-gray-300 px-2 py-1">3 #600KCMIL, 1#3/0 G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #500KCMIL, 1#250KCMIL G, 3" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">4 #4/0, 1#4 G, 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #300KCMIL, 1#2 G, 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F1200N</td>
                          <td className="border border-gray-300 px-2 py-1">1200</td>
                          <td className="border border-gray-300 px-2 py-1">4 #600KCMIL, 1#3/0 G, 4" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #500KCMIL, 1#250KCMIL G, 3-1/2" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">3 #250KCMIL, 1#4 G, 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #350KCMIL, 1#2 G, 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F1600</td>
                          <td className="border border-gray-300 px-2 py-1">1600</td>
                          <td className="border border-gray-300 px-2 py-1">4 #600KCMIL, 1#4/0 G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">5 #600KCMIL, 1#350KCMIL G, 3-1/2" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">4 #250KCMIL, 1#4 G, 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #350KCMIL, 1#2 G, 3" C</td>
                          <td className="border border-gray-300 px-2 py-1">F1600N</td>
                          <td className="border border-gray-300 px-2 py-1">1600</td>
                          <td className="border border-gray-300 px-2 py-1">4 #600KCMIL, 1#4/0 G, 4" C</td>
                          <td className="border border-gray-300 px-2 py-1">5 #600KCMIL, 1#350KCMIL G, 4" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">3 #300KCMIL, 1#4 G, 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #500KCMIL, 1#1 G, 3" C 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #500KCMIL, 1#1 G, 3" C</td>
                          <td className="border border-gray-300 px-2 py-1">F2000</td>
                          <td className="border border-gray-300 px-2 py-1">2000</td>
                          <td className="border border-gray-300 px-2 py-1">5 #600KCMIL, 1#250KCMIL G, 3-1/2" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">4 #300KCMIL, 1#4 G, 2-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #500KCMIL, 1#1 G, 3" C</td>
                          <td className="border border-gray-300 px-2 py-1">F2000N</td>
                          <td className="border border-gray-300 px-2 py-1">2000</td>
                          <td className="border border-gray-300 px-2 py-1">5 #600KCMIL, 1#250KCMIL G, 4" C</td>
                          <td className="border border-gray-300 px-2 py-1">6 #600KCMIL, 1#400KCMIL G, 4" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">3 #350KCMIL, 1#3 G, 3" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #600KCMIL, 1#1/0 G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F2500</td>
                          <td className="border border-gray-300 px-2 py-1">2500</td>
                          <td className="border border-gray-300 px-2 py-1">6 #600KCMIL, 1#350KCMIL G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">7 #700KCMIL, 1#600KCMIL G, 3-1/2" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">4 #350KCMIL, 1#3 G, 3" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #600KCMIL, 1#1/0 G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F2500N</td>
                          <td className="border border-gray-300 px-2 py-1">2500</td>
                          <td className="border border-gray-300 px-2 py-1">6 #600KCMIL, 1#350KCMIL G, 4" C</td>
                          <td className="border border-gray-300 px-2 py-1">7 #700KCMIL, 1#600KCMIL G, 4" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">3 #500KCMIL, 1#2 G, 3" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #700KCMIL, 1#1 G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F3000</td>
                          <td className="border border-gray-300 px-2 py-1">3000</td>
                          <td className="border border-gray-300 px-2 py-1">8 #500KCMIL, 1#400KCMIL G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">8 #700KCMIL, 1#600KCMIL G, 3-1/2" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">4 #500KCMIL, 1#2 G, 3" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #700KCMIL, 1#1 G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">F3000N</td>
                          <td className="border border-gray-300 px-2 py-1">3000</td>
                          <td className="border border-gray-300 px-2 py-1">8 #500KCMIL, 1#400KCMIL G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">8 #700KCMIL, 1#600KCMIL G, 4" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">3 #600KCMIL, 1#1 G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">3 #750KCMIL, 1#2/0 G, 4" C</td>
                          <td className="border border-gray-300 px-2 py-1">F3500</td>
                          <td className="border border-gray-300 px-2 py-1">3500</td>
                          <td className="border border-gray-300 px-2 py-1">9 #600KCMIL, 1#500KCMIL G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">10 #700KCMIL, 1#750KCMIL G, 3-1/2" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">4 #600KCMIL, 1#1 G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #750KCMIL, 1#2/0 G, 4" C</td>
                          <td className="border border-gray-300 px-2 py-1">F3500N</td>
                          <td className="border border-gray-300 px-2 py-1">3500</td>
                          <td className="border border-gray-300 px-2 py-1">9 #600KCMIL, 1#500KCMIL G, 4" C</td>
                          <td className="border border-gray-300 px-2 py-1">10 #700KCMIL, 1#750KCMIL G, 4" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">4 #600KCMIL, 1#1 G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #750KCMIL, 1#2/0 G, 4" C</td>
                          <td className="border border-gray-300 px-2 py-1">F4000</td>
                          <td className="border border-gray-300 px-2 py-1">4000</td>
                          <td className="border border-gray-300 px-2 py-1">10 #600KCMIL, 1#500KCMIL G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">11 #700KCMIL, 1#750KCMIL G, 3-1/2" C</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1">4 #600KCMIL, 1#1 G, 3-1/2" C</td>
                          <td className="border border-gray-300 px-2 py-1">4 #750KCMIL, 1#2/0 G, 4" C</td>
                          <td className="border border-gray-300 px-2 py-1">F4000N</td>
                          <td className="border border-gray-300 px-2 py-1">4000</td>
                          <td className="border border-gray-300 px-2 py-1">10 #600KCMIL, 1#500KCMIL G, 4" C</td>
                          <td className="border border-gray-300 px-2 py-1">11 #700KCMIL, 1#750KCMIL G, 4" C</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
                      <h4 className="font-bold mb-2 dark:text-gray-200">NOTES:</h4>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>
                          THIS TABLE IS BASED ON CONDUCTORS IN ELECTRIC METAL TUBING CONDUIT (EMT) AND FOR THE LENGTH OF
                          MAXIMUM 100 FEET FOR 208V, 3 PHASE, 4 WIRE AND 200 FEET FOR 480V, 3 PHASE, 4 WIRE SYSTEM.
                          CONDUCTORS SHALL BE XHWN/XHHN FOR UNDERGROUND AND WERE SUBJECT TO MOISTURE, ALL OTHER INDOOR
                          LOCATIONS SHALL USE THHN/THWN CONDUCTORS. ALL CABLES IN THE RACEWAYS EXPOSED TO SUNLIGHT SHALL
                          BE XHHW-2.
                        </li>
                        <li>
                          AT NO COST TO THE OWNER, CONDUIT SIZE SHALL BE ADJUSTED AS PER NATIONAL ELECTRICAL CODE WHEN
                          PROVIDED CONDUIT IS NOT EMT.
                        </li>
                        <li>
                          AT NO COST TO THE OWNER, WIRING SHALL BE MODIFIED AS PER NATIONAL ELECTRICAL CODE AS REQUIRED
                          TO COMPLY WITH VOLTAGE DROP LIMITATIONS, INCLUDING MODIFICATIONS TO THE CONDUIT SIZE WHERE
                          REQUIRED.
                        </li>
                        <li>
                          ALUMINUM CONDUCTORS ARE PERMITTED ONLY WITH OWNER APPROVAL AND FOR FEEDERS RATED 100A OR
                          LARGER.
                        </li>
                        <li>ALUMINUM FEEDERS MUST BE TERMINATED UTILIZING COMPRESSION TYPE CONNECTORS.</li>
                        <li>
                          ANY DISCREPANCY BETWEEN SIZES INDICATED IN THIS TABLE AND SIZES REQUIRED BY NATIONAL
                          ELECTRICAL CODE, NATIONAL CODE SHALL GOVERN.
                        </li>
                        <li>
                          OVERCURRENT PROTECTION DEVICES (OCPD) AMPACITY SHALL BE USED FOR FEEDER SIZING, UNLESS
                          INDICATED OTHERWISE ELSEWHERE IN CONTRACT DOCUMENTS. ANY DISCREPANCIES SHALL BE BROUGHT UP TO
                          IMMEDIATE ATTENTION OF THE ENGINEER.
                        </li>
                        <li>FEEDERS SHALL BE COMPATIBLE WITH EQUIPMENT LUG RATING AND MATERIAL.</li>
                        <li>
                          WHERE UNGROUNDED CONDUCTORS ARE INCREASED IN SIZE FROM WHAT SHOWN IN THE TABLE ABOVE,
                          GROUNDING CONDUCTOR(S) SHALL BE INCREASED IN SIZE PROPORTIONALLY ACCORDING TO THE CIRCULAR MIL
                          AREA OF THE UNGROUNDED CONDUCTORS.
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t bg-blue-50 dark:bg-blue-950 px-6 py-3 text-center text-xs text-blue-500 dark:text-blue-400">
        © 2026 Shaya Birnbaum. v2.0-Beta
      </CardFooter>
    </Card>
  )
}
