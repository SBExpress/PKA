"use client"

import { CalculationResult } from "@/lib/wire-calculations-v3"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Zap } from "lucide-react"

interface ResultGridDualProps {
  copper: { industryStandard: CalculationResult; optimized: CalculationResult }
  aluminum: { industryStandard: CalculationResult; optimized: CalculationResult }
  preferredType: "copper" | "aluminum"
  voltage: number
  amperage: number
  phase: "single" | "three"
}

function ResultCard({
  result,
  type,
  approach,
  isPreferred,
  isSmall,
  voltage,
  amperage,
}: {
  result: CalculationResult
  type: "copper" | "aluminum"
  approach: "Industry Standard" | "Optimized"
  isPreferred: boolean
  isSmall: boolean
  voltage: number
  amperage: number
}) {
  if (result.wireSize === "—") {
    return (
      <Card className={`border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 ${isSmall ? "h-auto" : ""}`}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-red-700 dark:text-red-300 flex items-center gap-2 ${isSmall ? "text-sm" : ""}`}>
            <AlertTriangle className="h-4 w-4" />
            {type === "copper" ? "Copper" : "Aluminum"}
          </CardTitle>
          <p className={`text-red-600 dark:text-red-400 ${isSmall ? "text-xs" : "text-sm"}`}>{approach}</p>
        </CardHeader>
        <CardContent className={`text-red-700 dark:text-red-300 ${isSmall ? "text-xs" : "text-sm"}`}>
          No Solution
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={`${
        result.isFailed
          ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950"
          : isPreferred
            ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950"
            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
      } ${isSmall ? "h-auto" : ""}`}
    >
      <CardHeader className={`pb-2 ${isSmall ? "space-y-1" : ""}`}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={`${result.isFailed ? "text-red-900 dark:text-red-100" : isPreferred ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100"} flex items-center gap-1 ${isSmall ? "text-sm" : "text-base"}`}>
              <Zap className={`${result.isFailed ? "text-red-600" : isPreferred ? "text-blue-600" : "text-gray-600"} ${isSmall ? "h-3 w-3" : "h-4 w-4"}`} />
              {type === "copper" ? "Copper" : "Aluminum"}
            </CardTitle>
            <p className={`${isPreferred ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"} ${isSmall ? "text-xs" : "text-xs"}`}>{approach}</p>
          </div>
          <Badge className={result.isFailed ? "bg-red-600 hover:bg-red-700" : isPreferred ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"}>
            {result.maxAmpacity}A
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={`space-y-2 ${isSmall ? "space-y-1" : "space-y-3"}`}>
        {/* Configuration */}
        <div className={`p-2 rounded border ${result.isFailed ? "bg-red-100 dark:bg-red-900 border-red-200" : isPreferred ? "bg-blue-100 dark:bg-blue-900 border-blue-200" : "bg-gray-100 dark:bg-gray-700 border-gray-200"}`}>
          <p className={`font-semibold text-gray-900 dark:text-white ${isSmall ? "text-xs" : "text-sm"}`}>
            {result.sets}-set{result.sets > 1 ? "s" : ""} × {result.wireSize}
          </p>
          <p className={`text-gray-600 dark:text-gray-400 ${isSmall ? "text-xs" : "text-xs"}`}>
            {result.groundWireSize} GND | {result.conduitSize} conduit
          </p>
        </div>

        {/* Key Metrics */}
        <div className={`grid gap-1 ${isSmall ? "grid-cols-2 text-xs" : "grid-cols-2 text-xs"}`}>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Max Run @ 3% VD</p>
            <p className="font-semibold text-gray-900 dark:text-white">{result.maxLength} ft</p>
            {!isSmall && <p className="text-xs text-gray-500 mt-1"><em>@ 100% load</em></p>}
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Fuse Size</p>
            <p className="font-semibold text-gray-900 dark:text-white">{result.fuseSize}A</p>
          </div>
        </div>

        {result.isFailed && (
          <p className={`text-red-600 dark:text-red-400 font-semibold ${isSmall ? "text-xs" : "text-sm"}`}>
            ⚠️ UNDERSIZED
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function ResultsGridDual({ copper, aluminum, preferredType, voltage, amperage, phase }: ResultGridDualProps) {
  const preferred = preferredType === "copper" ? copper : aluminum
  const alternative = preferredType === "copper" ? aluminum : copper

  const isError = preferred.industryStandard.wireSize === "—"

  if (isError) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            No Solution Found
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-700 dark:text-red-300">
          Unable to calculate feeder configuration for {amperage}A at {voltage}V {phase === "three" ? "3-phase" : "1-phase"}.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Top Row: Copper */}
        <div className="grid grid-cols-3 gap-4">
          {/* Industry Standard - Larger (2 cols) */}
          <div className="col-span-2">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">INDUSTRY STANDARD</h3>
            </div>
            <ResultCard
              result={preferred.industryStandard}
              type={preferredType}
              approach="Industry Standard"
              isPreferred={true}
              isSmall={false}
              voltage={voltage}
              amperage={amperage}
            />
          </div>

          {/* Optimized - Smaller (1 col) */}
          <div>
            <div className="mb-2">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">OPTIMIZED</h3>
            </div>
            <ResultCard
              result={preferred.optimized}
              type={preferredType}
              approach="Optimized"
              isPreferred={true}
              isSmall={true}
              voltage={voltage}
              amperage={amperage}
            />
          </div>
        </div>

        {/* Bottom Row: Aluminum */}
        <div className="grid grid-cols-3 gap-4">
          {/* Industry Standard - Larger (2 cols) */}
          <div className="col-span-2">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">INDUSTRY STANDARD</h3>
            </div>
            <ResultCard
              result={alternative.industryStandard}
              type={preferredType === "copper" ? "aluminum" : "copper"}
              approach="Industry Standard"
              isPreferred={false}
              isSmall={false}
              voltage={voltage}
              amperage={amperage}
            />
          </div>

          {/* Optimized - Smaller (1 col) */}
          <div>
            <div className="mb-2">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">OPTIMIZED</h3>
            </div>
            <ResultCard
              result={alternative.optimized}
              type={preferredType === "copper" ? "aluminum" : "copper"}
              approach="Optimized"
              isPreferred={false}
              isSmall={true}
              voltage={voltage}
              amperage={amperage}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="text-xs text-gray-600 dark:text-gray-400 border-t pt-4">
        <p>
          <strong>Industry Standard:</strong> Based on feeder schedule wire size chart (2026-06-01)
        </p>
        <p className="mt-1">
          <strong>Optimized:</strong> Best-fit sizing with minimum oversizing — closest ampacity to load
        </p>
        <p className="mt-2 italic">Per NEC 310.16 (75°C) & 310.15(B)(2) — Adjust conductor type or wire size limits in settings</p>
      </div>
    </div>
  )
}
