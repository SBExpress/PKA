"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings } from "lucide-react"
import { Preferences } from "@/hooks/usePreferences"

interface SettingsDialogProps {
  preferences: Preferences
  onPreferencesChange: (newPreferences: Partial<Preferences>) => void
  onReset: () => void
}

const WIRE_SIZES = [
  "14 AWG", "12 AWG", "10 AWG", "8 AWG", "6 AWG", "4 AWG", "3 AWG", "2 AWG", "1 AWG",
  "1/0 AWG", "2/0 AWG", "3/0 AWG", "4/0 AWG",
  "250 kcmil", "300 kcmil", "350 kcmil", "400 kcmil", "500 kcmil", "600 kcmil",
  "700 kcmil", "750 kcmil", "800 kcmil", "900 kcmil", "1000 kcmil"
]

export function SettingsDialog({ preferences, onPreferencesChange, onReset }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempPreferences, setTempPreferences] = useState<Partial<Preferences>>(preferences)

  const handleInputChange = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setTempPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    onPreferencesChange(tempPreferences)
    setOpen(false)
  }

  const handleReset = () => {
    onReset()
    setTempPreferences(preferences)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTempPreferences(preferences)
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-indigo-600 dark:text-indigo-400"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your default preferences and wire size limits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Default Values Section */}
          <div className="space-y-4 pb-4 border-b border-indigo-200 dark:border-indigo-800">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              Default Values
            </h3>

            <div className="space-y-2">
              <Label htmlFor="defaultAmperage" className="text-xs font-medium">
                Load Amperage
              </Label>
              <Input
                id="defaultAmperage"
                type="number"
                value={tempPreferences.defaultAmperage}
                onChange={(e) => handleInputChange("defaultAmperage", Number(e.target.value))}
                min="1"
                max="4000"
                className="border-indigo-200 dark:border-indigo-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultVoltage" className="text-xs font-medium">
                System Voltage
              </Label>
              <Select
                value={String(tempPreferences.defaultVoltage)}
                onValueChange={(v) => handleInputChange("defaultVoltage", Number(v) as any)}
              >
                <SelectTrigger id="defaultVoltage" className="border-indigo-200 dark:border-indigo-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[120, 208, 240, 277, 480, 600].map((v) => (
                    <SelectItem key={v} value={String(v)}>
                      {v}V
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultPhase" className="text-xs font-medium">
                Phase
              </Label>
              <Select
                value={tempPreferences.defaultPhase}
                onValueChange={(v) => handleInputChange("defaultPhase", v as any)}
              >
                <SelectTrigger id="defaultPhase" className="border-indigo-200 dark:border-indigo-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">1-Phase</SelectItem>
                  <SelectItem value="three">3-Phase</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultConductor" className="text-xs font-medium">
                Conductor Type
              </Label>
              <Select
                value={tempPreferences.defaultConductorType}
                onValueChange={(v) => handleInputChange("defaultConductorType", v as any)}
              >
                <SelectTrigger id="defaultConductor" className="border-indigo-200 dark:border-indigo-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="copper">Copper</SelectItem>
                  <SelectItem value="aluminum">Aluminum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultTemp" className="text-xs font-medium">
                Temperature Rating
              </Label>
              <Select
                value={tempPreferences.defaultTempRating}
                onValueChange={(v) => handleInputChange("defaultTempRating", v)}
              >
                <SelectTrigger id="defaultTemp" className="border-indigo-200 dark:border-indigo-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">60°C</SelectItem>
                  <SelectItem value="75">75°C (Standard)</SelectItem>
                  <SelectItem value="90">90°C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultVD" className="text-xs font-medium">
                Default Voltage Drop %
              </Label>
              <Select
                value={String(tempPreferences.defaultVoltageDropPercent)}
                onValueChange={(v) => handleInputChange("defaultVoltageDropPercent", Number(v) as any)}
              >
                <SelectTrigger id="defaultVD" className="border-indigo-200 dark:border-indigo-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {p}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultRunLength" className="text-xs font-medium">
                Default Run Length (optional, in feet)
              </Label>
              <Input
                id="defaultRunLength"
                type="number"
                value={tempPreferences.defaultRunLength ?? ""}
                onChange={(e) =>
                  handleInputChange(
                    "defaultRunLength",
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                placeholder="Leave blank for no default"
                className="border-indigo-200 dark:border-indigo-700"
              />
            </div>
          </div>

          {/* Wire Size Limits Section */}
          <div className="space-y-4 pb-4 border-b border-indigo-200 dark:border-indigo-800">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              Maximum Wire Sizes
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Calculations will never recommend sizes larger than these limits
            </p>

            <div className="space-y-2">
              <Label htmlFor="maxCopperWire" className="text-xs font-medium">
                Maximum Copper Wire Size
              </Label>
              <Select
                value={tempPreferences.maxCopperWireSize}
                onValueChange={(v) => handleInputChange("maxCopperWireSize", v)}
              >
                <SelectTrigger id="maxCopperWire" className="border-indigo-200 dark:border-indigo-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WIRE_SIZES.map((size) => (
                    <SelectItem key={`cu-${size}`} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAluminumWire" className="text-xs font-medium">
                Maximum Aluminum Wire Size
              </Label>
              <Select
                value={tempPreferences.maxAluminumWireSize}
                onValueChange={(v) => handleInputChange("maxAluminumWireSize", v)}
              >
                <SelectTrigger id="maxAluminumWire" className="border-indigo-200 dark:border-indigo-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WIRE_SIZES.map((size) => (
                    <SelectItem key={`al-${size}`} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* UI Preferences Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              UI Preferences
            </h3>

            <div className="space-y-2">
              <Label htmlFor="ampsPerClick" className="text-xs font-medium">
                Amperage Increment (per click)
              </Label>
              <Input
                id="ampsPerClick"
                type="number"
                value={tempPreferences.ampsPerClick}
                onChange={(e) => handleInputChange("ampsPerClick", Number(e.target.value))}
                min="1"
                max="100"
                className="border-indigo-200 dark:border-indigo-700"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                How much to change amperage with +/- buttons (1-100)
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-4 border-t border-indigo-200 dark:border-indigo-800">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900"
          >
            Reset to Defaults
          </Button>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
