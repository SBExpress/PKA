"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Minus } from "lucide-react"

interface CalculatorFormProps {
  amperage: number
  setAmperage: (value: number) => void
  voltage: number
  setVoltage: (value: number) => void
  phase: "single" | "three"
  setPhase: (value: "single" | "three") => void
  conductorType: "copper" | "aluminum"
  setConductorType: (value: "copper" | "aluminum") => void
  tempRating: string
  setTempRating: (value: string) => void
  includeNeutral: boolean
  setIncludeNeutral: (value: boolean) => void
  runLength: number | null
  setRunLength: (value: number | null) => void
  maxVoltageDropPercent: number
  setMaxVoltageDropPercent: (value: number) => void
  onCalculate: () => void
  ampsPerClick: number
  // Manual override
  manualOverride: boolean
  setManualOverride: (value: boolean) => void
  manualWireSize: string
  setManualWireSize: (value: string) => void
  numberOfSets: number
  setNumberOfSets: (value: number) => void
  recommendedWireSize?: string // For highlighting in dropdown
  // Wire size limits
  maxCopperWireSize?: string
  maxAluminumWireSize?: string
}

export function CalculatorFormV3(props: CalculatorFormProps) {
  const {
    amperage,
    setAmperage,
    voltage,
    setVoltage,
    phase,
    setPhase,
    conductorType,
    setConductorType,
    tempRating,
    setTempRating,
    includeNeutral,
    setIncludeNeutral,
    runLength,
    setRunLength,
    maxVoltageDropPercent,
    setMaxVoltageDropPercent,
    onCalculate,
    ampsPerClick,
    manualOverride,
    setManualOverride,
    manualWireSize,
    setManualWireSize,
    numberOfSets,
    setNumberOfSets,
    maxCopperWireSize = "600 kcmil",
    maxAluminumWireSize = "750 kcmil",
  } = props

  const allWireSizes = [
    "14 AWG", "12 AWG", "10 AWG", "8 AWG", "6 AWG", "4 AWG", "3 AWG", "2 AWG", "1 AWG",
    "1/0 AWG", "2/0 AWG", "3/0 AWG", "4/0 AWG",
    "250 kcmil", "300 kcmil", "350 kcmil", "400 kcmil", "500 kcmil", "600 kcmil",
    "700 kcmil", "750 kcmil", "800 kcmil", "900 kcmil", "1000 kcmil"
  ]

  // Filter wire sizes based on max allowed for selected conductor type
  const maxWireSize = conductorType === "copper" ? maxCopperWireSize : maxAluminumWireSize
  const maxWireSizeIndex = allWireSizes.indexOf(maxWireSize)
  const wireSizes = maxWireSizeIndex >= 0 ? allWireSizes.slice(0, maxWireSizeIndex + 1) : allWireSizes

  const conduitSizes = ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '3-1/2"', '4"']

  return (
    <div className="space-y-6">
      {/* Amperage Section */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Load Amperage
        </Label>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAmperage(Math.max(1, amperage - ampsPerClick))}
            className="h-10 w-10 border-indigo-200 dark:border-indigo-700"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={amperage}
            onChange={(e) => {
              const val = e.target.value
              if (val === '') {
                setAmperage(0)
              } else {
                setAmperage(Math.max(1, Math.min(4000, Number(val))))
              }
            }}
            className="text-center text-xl font-bold border-2 border-indigo-200 dark:border-indigo-700"
            min="1"
            max="4000"
          />
          <span className="text-sm font-medium">A</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAmperage(Math.min(4000, amperage + ampsPerClick))}
            className="h-10 w-10 border-indigo-200 dark:border-indigo-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500">±{ampsPerClick}A per click</p>
      </div>

      {/* Voltage Section */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          System Voltage
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {[120, 208, 240, 277, 480, 600].map((v) => (
            <Button
              key={v}
              variant={voltage === v ? "default" : "outline"}
              className={`text-sm font-medium ${
                voltage === v
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900"
              }`}
              onClick={() => setVoltage(v)}
            >
              {v}V
            </Button>
          ))}
        </div>
      </div>

      {/* Conductor Type */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Conductor Type
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "copper" as const, label: "Copper" },
            { value: "aluminum" as const, label: "Aluminum" },
          ].map((option) => (
            <Button
              key={option.value}
              variant={conductorType === option.value ? "default" : "outline"}
              className={`${
                conductorType === option.value
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300"
              }`}
              onClick={() => setConductorType(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Phase & Temperature */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <Label htmlFor="phase" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Phase
          </Label>
          <Select value={phase} onValueChange={(v) => setPhase(v as "single" | "three")}>
            <SelectTrigger id="phase" className="border-indigo-200 dark:border-indigo-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">1-Phase</SelectItem>
              <SelectItem value="three">3-Phase</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="temp" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Temperature Rating
          </Label>
          <Select value={tempRating} onValueChange={setTempRating}>
            <SelectTrigger id="temp" className="border-indigo-200 dark:border-indigo-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60">60°C</SelectItem>
              <SelectItem value="75">75°C (Standard)</SelectItem>
              <SelectItem value="90">90°C</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Voltage Drop */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Max Voltage Drop
        </Label>
        <div className="grid grid-cols-5 gap-1">
          {[1, 2, 3, 4, 5].map((percent) => (
            <Button
              key={percent}
              variant={maxVoltageDropPercent === percent ? "default" : "outline"}
              size="sm"
              className={`text-xs ${
                maxVoltageDropPercent === percent
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700"
              }`}
              onClick={() => setMaxVoltageDropPercent(percent)}
            >
              {percent}%
            </Button>
          ))}
        </div>
      </div>

      {/* Include Neutral (for non-120V) */}
      {voltage !== 120 && (
        <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-100 dark:border-indigo-800">
          <Label htmlFor="neutral" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Include Neutral
          </Label>
          <Switch
            id="neutral"
            checked={includeNeutral}
            onCheckedChange={setIncludeNeutral}
          />
        </div>
      )}

      {/* Run Length (Optional) */}
      <div className="space-y-3">
        <Label htmlFor="runLength" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Run Length (optional)
        </Label>
        <div className="relative">
          <Input
            type="number"
            id="runLength"
            value={runLength === null ? "" : runLength}
            onChange={(e) => setRunLength(e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Leave blank for schedule sizing"
            className="pr-12 border-indigo-200 dark:border-indigo-700"
            min="0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            feet
          </span>
        </div>
        {runLength && (
          <p className="text-xs text-indigo-600 dark:text-indigo-400">
            📍 Finding optimal wire size for {runLength}ft run...
          </p>
        )}
      </div>

      {/* Manual Override Section */}
      <div className="space-y-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <Label htmlFor="manual" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Manual Override
          </Label>
          <Switch
            id="manual"
            checked={manualOverride}
            onCheckedChange={setManualOverride}
          />
        </div>

        {manualOverride && (
          <div className="space-y-3 pt-2 border-t border-purple-200 dark:border-purple-700">
            {/* Wire Size with +/- buttons */}
            <div className="space-y-2">
              <Label htmlFor="wireSize" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Wire Size {props.recommendedWireSize && <span className="text-purple-600 dark:text-purple-400">(Rec: {props.recommendedWireSize})</span>}
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-indigo-200 dark:border-indigo-700"
                  onClick={() => {
                    const currentIndex = wireSizes.indexOf(manualWireSize)
                    if (currentIndex > 0) setManualWireSize(wireSizes[currentIndex - 1])
                  }}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Select value={manualWireSize} onValueChange={setManualWireSize}>
                  <SelectTrigger id="wireSize" className="text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {wireSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}{props.recommendedWireSize === size && " ✓ (recommended)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-indigo-200 dark:border-indigo-700"
                  onClick={() => {
                    const currentIndex = wireSizes.indexOf(manualWireSize)
                    if (currentIndex < wireSizes.length - 1) setManualWireSize(wireSizes[currentIndex + 1])
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                Max: {maxWireSize}
              </p>
            </div>

            {/* Number of Sets with +/- buttons */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Number of Sets
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-indigo-200 dark:border-indigo-700"
                  onClick={() => setNumberOfSets(Math.max(1, numberOfSets - 1))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="flex-1 text-center bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded px-3 py-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {numberOfSets} set{numberOfSets > 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-indigo-200 dark:border-indigo-700"
                  onClick={() => setNumberOfSets(Math.min(6, numberOfSets + 1))}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calculate Button */}
      <Button
        onClick={onCalculate}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 text-lg"
      >
        Calculate Feeder
      </Button>
    </div>
  )
}
