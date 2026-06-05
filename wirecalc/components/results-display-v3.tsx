"use client"

import { CalculationResult } from "@/lib/wire-calculations-v3"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, AlertTriangle, CheckCircle } from "lucide-react"

interface ResultsDisplayProps {
  copper: CalculationResult
  aluminum: CalculationResult
  preferredType: "copper" | "aluminum"
  runLength: number | null
  voltage: number
  amperage: number
  phase: "single" | "three"
}

export function ResultsDisplayV3({
  copper,
  aluminum,
  preferredType,
  runLength,
  voltage,
  amperage,
  phase,
}: ResultsDisplayProps) {
  const preferred = preferredType === "copper" ? copper : aluminum
  const alternative = preferredType === "copper" ? aluminum : copper

  const isError = preferred.wireSize === "—"

  if (isError) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            No Solution Found
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            Unable to find a wire size that meets the voltage drop constraint at this run length.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-red-700 dark:text-red-300">
          Try increasing the maximum voltage drop percentage or reducing the run length.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Optimal Banner */}
      {runLength && runLength > 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-700 dark:text-green-300 text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Optimal Configuration ({preferredType === "copper" ? "Copper" : "Aluminum"})
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Sized for {voltage}V {phase === "three" ? "3-Phase" : "1-Phase"} at {amperage}A over {runLength}ft
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-100 dark:border-green-700">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{preferred.wireSize}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{preferred.sets} set(s) in {preferred.conduitSize}</p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-2">
                VD: {preferred.voltageDropPercent}%
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferred Conductor */}
      <Card className={`${preferred.isFailed ? "border-red-300 dark:border-red-700" : "border-indigo-200 dark:border-indigo-800"}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`${preferred.isFailed ? "text-red-900 dark:text-red-100" : "text-indigo-900 dark:text-indigo-100"} flex items-center gap-2`}>
                <Zap className={`h-5 w-5 ${preferred.isFailed ? "text-red-600 dark:text-red-400" : "text-indigo-600 dark:text-indigo-400"}`} />
                {preferredType === "copper" ? "Copper" : "Aluminum"} (Preferred)
                {preferred.isFailed && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">⚠️ UNDERSIZED</span>}
              </CardTitle>
              <CardDescription>
                {preferred.isFailed
                  ? "Wire size cannot carry this load"
                  : (runLength ? "Optimal for voltage drop constraint" : "Standard feeder schedule")}
              </CardDescription>
            </div>
            <Badge className={preferred.isFailed ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}>
              {preferred.maxAmpacity}A
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Configuration */}
          <div className={`p-4 rounded-lg border ${preferred.isFailed
            ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-700"
            : "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-700"}`}>
            <p className={`text-xs font-semibold mb-2 ${preferred.isFailed
              ? "text-red-600 dark:text-red-400"
              : "text-indigo-600 dark:text-indigo-400"}`}>
              Configuration
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {preferred.sets}-set{preferred.sets > 1 ? "s" : ""} of ({preferred.wireSize}){" "}
              <span className={preferred.isFailed ? "text-red-600 dark:text-red-400" : "text-indigo-600 dark:text-indigo-400"}>
                + {preferred.groundWireSize} GND
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Conduit Size</p>
                <p className="font-semibold text-gray-900 dark:text-white">{preferred.conduitSize}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Max Ampacity</p>
                <p className={`font-semibold ${preferred.isFailed ? "text-red-600 dark:text-red-500" : "text-gray-900 dark:text-white"}`}>
                  {preferred.maxAmpacity}A
                </p>
              </div>
            </div>
            <div className={`grid grid-cols-2 gap-2 text-xs border-t pt-2 ${preferred.isFailed
              ? "border-red-200 dark:border-red-700"
              : "border-indigo-200 dark:border-indigo-700"}`}>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Total Wires</p>
                <p className="font-semibold text-gray-900 dark:text-white">{preferred.quantityWires}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">OCPD Fuse Size</p>
                <p className="font-semibold text-gray-900 dark:text-white">{preferred.fuseSize}A</p>
              </div>
            </div>
          </div>

          {/* Voltage Drop Info */}
          {runLength && runLength > 0 ? (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className={`p-2 rounded ${preferred.isFailed ? "bg-red-100 dark:bg-red-900" : "bg-gray-50 dark:bg-gray-800"}`}>
                <p className="text-gray-600 dark:text-gray-400">Voltage Drop</p>
                <p className={`font-bold ${preferred.isFailed ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"}`}>
                  {preferred.voltageDrop}V
                </p>
                <p className={preferred.isFailed ? "text-red-600" : "text-gray-500"}>({preferred.voltageDropPercent}%)</p>
              </div>
              <div className={`p-2 rounded ${preferred.isFailed ? "bg-red-100 dark:bg-red-900" : "bg-gray-50 dark:bg-gray-800"}`}>
                <p className="text-gray-600 dark:text-gray-400">Voltage at Load</p>
                <p className={`font-bold ${preferred.isFailed ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"}`}>
                  {preferred.voltageAtLoad}V
                </p>
              </div>
              <div className={`p-2 rounded ${preferred.isFailed ? "bg-red-100 dark:bg-red-900" : "bg-gray-50 dark:bg-gray-800"}`}>
                <p className="text-gray-600 dark:text-gray-400">Run Length</p>
                <p className={`font-bold ${preferred.isFailed ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"}`}>
                  {runLength}ft
                </p>
              </div>
            </div>
          ) : (
            <div className={`p-3 rounded border-l-2 ${preferred.isFailed
              ? "bg-red-50 dark:bg-red-900 border-red-500"
              : "bg-indigo-50 dark:bg-indigo-900 border-indigo-500"}`}>
              <p className={`text-xs font-semibold mb-1 ${preferred.isFailed ? "text-red-600 dark:text-red-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                Max Run Length @ 3% VD
              </p>
              <p className={`text-lg font-bold ${preferred.isFailed ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"}`}>
                {preferred.maxLength} feet
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                <em>At 100% load</em>
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 italic border-t border-indigo-200 dark:border-indigo-700 pt-3">
            <strong>Basis:</strong> 100% of input load | Per NEC 310.16 (75°C) & 310.15(B)(2)
          </p>
        </CardContent>
      </Card>

      {/* Alternative Conductor */}
      <Card className={`${alternative.isFailed ? "border-red-300 dark:border-red-700" : "border-gray-200 dark:border-gray-700"}`}>
        <CardHeader>
          <CardTitle className={`${alternative.isFailed ? "text-red-900 dark:text-red-100" : "text-gray-700 dark:text-gray-300"} flex items-center gap-2`}>
            <Zap className={`h-5 w-5 ${alternative.isFailed ? "text-red-600 dark:text-red-400" : "text-gray-400"}`} />
            {preferredType === "copper" ? "Aluminum" : "Copper"} (Alternative)
            {alternative.isFailed && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">⚠️ UNDERSIZED</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={`p-4 rounded-lg border ${alternative.isFailed
            ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-700"
            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
            <p className={`text-xs font-semibold mb-2 ${alternative.isFailed
              ? "text-red-600 dark:text-red-400"
              : "text-gray-600 dark:text-gray-400"}`}>
              Configuration
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {alternative.sets}-set{alternative.sets > 1 ? "s" : ""} of ({alternative.wireSize}){" "}
              <span className={alternative.isFailed ? "text-red-600 dark:text-red-400" : "text-gray-500"}>
                + {alternative.groundWireSize} GND
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Conduit Size</p>
                <p className="font-semibold text-gray-900 dark:text-white">{alternative.conduitSize}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Max Ampacity</p>
                <p className={`font-semibold ${alternative.isFailed ? "text-red-600 dark:text-red-500" : "text-gray-900 dark:text-white"}`}>
                  {alternative.maxAmpacity}A
                </p>
              </div>
            </div>
            <div className={`grid grid-cols-2 gap-2 text-xs border-t pt-2 ${alternative.isFailed
              ? "border-red-200 dark:border-red-700"
              : "border-gray-200 dark:border-gray-700"}`}>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Total Wires</p>
                <p className="font-semibold text-gray-900 dark:text-white">{alternative.quantityWires}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">OCPD Fuse Size</p>
                <p className="font-semibold text-gray-900 dark:text-white">{alternative.fuseSize}A</p>
              </div>
            </div>
          </div>

          {runLength && runLength > 0 ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                <p className="text-gray-600 dark:text-gray-400">Voltage Drop</p>
                <p className="font-bold text-gray-900 dark:text-white">{alternative.voltageDrop}V</p>
                <p className="text-gray-500">({alternative.voltageDropPercent}%)</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                <p className="text-gray-600 dark:text-gray-400">Voltage at Load</p>
                <p className="font-bold text-gray-900 dark:text-white">{alternative.voltageAtLoad}V</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Max Run Length @ 3% VD</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{alternative.maxLength} feet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
