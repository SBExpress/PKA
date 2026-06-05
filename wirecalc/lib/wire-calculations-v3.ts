// Improved Wire and Conduit Calculation Logic - v3.0
// Fixed temperature derating, adjustment factors, and bugs

import { NEC_310_16, NEC_310_15_B_2_ADJUSTMENT, NEC_310_15_AMBIENT_TEMP, getFuseSize } from "./nec-tables"

// Helper function to calculate total quantity of wires needed
function calculateQuantityWires(phase: "single" | "three", includeNeutral: boolean, numberOfSets: number): number {
  let wiresPerSet = 0

  if (phase === "three") {
    wiresPerSet = 3 // 3 phase wires
    if (includeNeutral) wiresPerSet += 1 // + neutral
  } else {
    wiresPerSet = 1 // 1 phase wire
    if (includeNeutral) wiresPerSet += 1 // + neutral
  }

  wiresPerSet += 1 // + ground wire always

  return wiresPerSet * numberOfSets
}

interface WireSize {
  wireSize: string
  copperAmpacity: number
  aluminumAmpacity: number
}

const wireSizesOrdered = [
  "14 AWG", "12 AWG", "10 AWG", "8 AWG", "6 AWG", "4 AWG", "3 AWG", "2 AWG", "1 AWG",
  "1/0 AWG", "2/0 AWG", "3/0 AWG", "4/0 AWG",
  "250 kcmil", "300 kcmil", "350 kcmil", "400 kcmil", "500 kcmil", "600 kcmil",
  "700 kcmil", "750 kcmil", "800 kcmil", "900 kcmil", "1000 kcmil"
]

// ============================================================================
// Get ampacity from NEC 310.16 with temperature rating
// ============================================================================
function getAmpacity(wireSize: string, conductorType: "copper" | "aluminum", tempRating: string): number {
  const row = NEC_310_16.find(r => r.wireSize === wireSize)
  if (!row) return 0

  const key = `${conductorType}${tempRating}C` as keyof typeof row
  return row[key] as number || 0
}

// Find the best (smallest) wire size that meets or exceeds the required ampacity
// ============================================================================
function findBestWireSizeFromNEC(
  requiredAmpacity: number,
  conductorType: "copper" | "aluminum",
  tempRating: string,
  maxWireSize: string = conductorType === "copper" ? "600 kcmil" : "750 kcmil"
): { wireSize: string; ampacity: number } | null {
  const maxWireSizeIndex = wireSizesOrdered.indexOf(maxWireSize)
  const searchRange = maxWireSizeIndex >= 0 ? wireSizesOrdered.slice(0, maxWireSizeIndex + 1) : wireSizesOrdered

  // Find the first wire size where ampacity >= required
  for (const wireSize of searchRange) {
    const ampacity = getAmpacity(wireSize, conductorType, tempRating)
    if (ampacity >= requiredAmpacity) {
      return { wireSize, ampacity }
    }
  }

  // If no wire found within max, try with parallel sets (emergency fallback)
  // Return largest available wire - caller will calculate multiple sets needed
  const largestWire = searchRange[searchRange.length - 1]
  const largestAmpacity = getAmpacity(largestWire, conductorType, tempRating)
  return { wireSize: largestWire, ampacity: largestAmpacity }
}

// Find optimal configuration (wire size + sets) with MINIMUM OVERSIZING
// ============================================================================
function findOptimalConfiguration(
  requiredAmpacity: number,
  conductorType: "copper" | "aluminum",
  tempRating: string,
  adjustmentFactor: number,
  maxWireSize: string = conductorType === "copper" ? "600 kcmil" : "750 kcmil"
): { wireSize: string; sets: number; totalAmpacity: number } | null {
  const maxWireSizeIndex = wireSizesOrdered.indexOf(maxWireSize)
  const searchRange = maxWireSizeIndex >= 0 ? wireSizesOrdered.slice(0, maxWireSizeIndex + 1) : wireSizesOrdered

  // Store all valid configurations
  const validConfigs: Array<{ wireSize: string; sets: number; totalAmpacity: number }> = []

  // Try 1 to 6 sets
  for (let sets = 1; sets <= 6; sets++) {
    const ampPerSet = requiredAmpacity / sets

    // For each wire size, check if it can handle the load
    for (const wireSize of searchRange) {
      const baseAmpacity = getAmpacity(wireSize, conductorType, tempRating)
      const adjustedAmpacity = baseAmpacity * adjustmentFactor
      const totalAmpacity = adjustedAmpacity * sets

      // If this config meets the requirement, add it
      if (totalAmpacity >= requiredAmpacity) {
        validConfigs.push({ wireSize, sets, totalAmpacity })
      }
    }
  }

  // If no valid configs found, return null
  if (validConfigs.length === 0) return null

  // Sort by totalAmpacity (ascending) - pick the one with minimum oversizing
  validConfigs.sort((a, b) => a.totalAmpacity - b.totalAmpacity)

  // Return the best fit (smallest adequate ampacity)
  return validConfigs[0]
}

// ============================================================================
// Ground wire sizing from NEC 250.122
// ============================================================================
// Ground wire sizing from NEC 250.122 - based on OCPD/amperage rating
function getGroundWireSize(amperage: number, conductorType: "copper" | "aluminum"): string {
  const groundTable: Record<number, { copper: string; aluminum: string }> = {
    15: { copper: "14 AWG", aluminum: "12 AWG" },
    20: { copper: "12 AWG", aluminum: "10 AWG" },
    30: { copper: "10 AWG", aluminum: "8 AWG" },
    40: { copper: "10 AWG", aluminum: "8 AWG" },
    60: { copper: "10 AWG", aluminum: "8 AWG" },
    100: { copper: "8 AWG", aluminum: "6 AWG" },
    125: { copper: "8 AWG", aluminum: "6 AWG" },
    150: { copper: "6 AWG", aluminum: "4 AWG" },
    175: { copper: "6 AWG", aluminum: "4 AWG" },
    200: { copper: "6 AWG", aluminum: "4 AWG" },
    225: { copper: "4 AWG", aluminum: "2 AWG" },
    250: { copper: "4 AWG", aluminum: "2 AWG" },
    300: { copper: "2 AWG", aluminum: "1/0 AWG" },
    350: { copper: "1 AWG", aluminum: "1/0 AWG" },
    400: { copper: "1 AWG", aluminum: "1/0 AWG" },
    500: { copper: "1 AWG", aluminum: "1/0 AWG" },
    600: { copper: "2/0 AWG", aluminum: "4/0 AWG" },
    800: { copper: "3/0 AWG", aluminum: "250 kcmil" },
    1000: { copper: "4/0 AWG", aluminum: "350 kcmil" },
    1200: { copper: "250 kcmil", aluminum: "400 kcmil" },
    1600: { copper: "4/0 AWG", aluminum: "350 kcmil" },
    2000: { copper: "250 kcmil", aluminum: "400 kcmil" },
    2500: { copper: "350 kcmil", aluminum: "600 kcmil" },
    3000: { copper: "400 kcmil", aluminum: "600 kcmil" },
    4000: { copper: "500 kcmil", aluminum: "750 kcmil" },
    6000: { copper: "800 kcmil", aluminum: "1200 kcmil" },
  }
  const ratings = Object.keys(groundTable).map(Number).sort((a, b) => a - b)
  let targetRating = ratings[ratings.length - 1] // Default to highest rating
  for (const rating of ratings) {
    if (amperage <= rating) {
      targetRating = rating
      break
    }
  }
  return groundTable[targetRating][conductorType]
}

// ============================================================================
// Resistance values at 68°F (ohms per 1000 feet)
// ============================================================================
const resistanceValues: Record<string, { copper: number; aluminum: number }> = {
  "14 AWG": { copper: 3.07, aluminum: 5.06 },
  "12 AWG": { copper: 1.93, aluminum: 3.18 },
  "10 AWG": { copper: 1.21, aluminum: 2.0 },
  "8 AWG": { copper: 0.764, aluminum: 1.26 },
  "6 AWG": { copper: 0.491, aluminum: 0.808 },
  "4 AWG": { copper: 0.308, aluminum: 0.508 },
  "3 AWG": { copper: 0.245, aluminum: 0.403 },
  "2 AWG": { copper: 0.194, aluminum: 0.319 },
  "1 AWG": { copper: 0.154, aluminum: 0.253 },
  "1/0 AWG": { copper: 0.122, aluminum: 0.201 },
  "2/0 AWG": { copper: 0.0967, aluminum: 0.159 },
  "3/0 AWG": { copper: 0.0766, aluminum: 0.126 },
  "4/0 AWG": { copper: 0.0608, aluminum: 0.1 },
  "250 kcmil": { copper: 0.0515, aluminum: 0.0847 },
  "300 kcmil": { copper: 0.0429, aluminum: 0.0707 },
  "350 kcmil": { copper: 0.0367, aluminum: 0.0605 },
  "400 kcmil": { copper: 0.0321, aluminum: 0.0529 },
  "500 kcmil": { copper: 0.0258, aluminum: 0.0424 },
  "600 kcmil": { copper: 0.0214, aluminum: 0.0353 },
  "700 kcmil": { copper: 0.0184, aluminum: 0.0303 },
  "750 kcmil": { copper: 0.0171, aluminum: 0.0282 },
  "800 kcmil": { copper: 0.0161, aluminum: 0.0265 },
  "900 kcmil": { copper: 0.0143, aluminum: 0.0235 },
  "1000 kcmil": { copper: 0.0129, aluminum: 0.0212 },
}

// ============================================================================
// Get adjustment factor for number of conductors
// ============================================================================
function getAdjustmentFactor(conductorCount: number): number {
  const factors = NEC_310_15_B_2_ADJUSTMENT
  if (conductorCount <= 3) return 1.0
  if (conductorCount <= 6) return 0.8
  if (conductorCount <= 9) return 0.7
  if (conductorCount <= 20) return 0.5
  if (conductorCount <= 30) return 0.45
  if (conductorCount <= 40) return 0.4
  return 0.35
}

// ============================================================================
// Calculate voltage drop
// ============================================================================
function calculateVoltageDrop(
  amperage: number,
  wireSize: string,
  length: number,
  voltage: number,
  phase: "single" | "three",
  conductorType: "copper" | "aluminum",
): number {
  const resistance = resistanceValues[wireSize]?.[conductorType] || 0.1
  const multiplier = phase === "three" ? Math.sqrt(3) : 2
  const voltageDrop = (multiplier * resistance * amperage * length) / 1000
  return voltageDrop
}

// ============================================================================
// Calculate maximum run length for voltage drop constraint
// ============================================================================
function calculateMaxLength(
  amperage: number,
  wireSize: string,
  voltage: number,
  phase: "single" | "three",
  conductorType: "copper" | "aluminum",
  maxVoltageDropPercent: number,
): number {
  const maxVoltageDrop = (voltage * maxVoltageDropPercent) / 100
  const resistance = resistanceValues[wireSize]?.[conductorType] || 0.1
  const multiplier = phase === "three" ? Math.sqrt(3) : 2
  const maxLength = (maxVoltageDrop * 1000) / (multiplier * resistance * amperage)
  return Math.floor(maxLength)
}

// ============================================================================
// Find optimal wire size for run length and voltage drop
// ============================================================================
export function findOptimalWireSize(
  amperage: number,
  runLength: number,
  voltage: number,
  phase: "single" | "three",
  conductorType: "copper" | "aluminum",
  tempRating: string,
  maxVoltageDropPercent: number,
  maxWireSize: string = "1000 kcmil",
  conductorCount: number = 3,
  includeNeutral: boolean = false,
): {
  wireSize: string
  groundSize: string
  conduitSize: string
  sets: number
  voltageDropPercent: number
  voltageDrop: number
  maxAmpacity: number
} | null {
  const maxAllowedVoltageDrop = (voltage * maxVoltageDropPercent) / 100
  const multiplier = phase === "three" ? Math.sqrt(3) : 2
  const adjustmentFactor = getAdjustmentFactor(conductorCount)

  // Filter wire sizes to exclude any larger than max
  const maxWireSizeIndex = wireSizesOrdered.indexOf(maxWireSize)
  const allowedWireSizes = maxWireSizeIndex >= 0
    ? wireSizesOrdered.slice(0, maxWireSizeIndex + 1)
    : wireSizesOrdered

  // Try different number of parallel sets (1 to 6)
  for (let sets = 1; sets <= 6; sets++) {
    const currentPerSet = amperage / sets

    // Iterate through allowed wire sizes from smallest to largest
    for (const wireSize of allowedWireSizes) {
      const baseAmpacity = getAmpacity(wireSize, conductorType, tempRating)
      const adjustedAmpacity = baseAmpacity * adjustmentFactor

      // Skip if wire can't handle the current per set
      if (adjustedAmpacity < currentPerSet) continue

      // Calculate voltage drop
      const resistance = resistanceValues[wireSize]?.[conductorType]
      if (!resistance) continue

      const voltageDrop = (multiplier * resistance * currentPerSet * runLength) / 1000
      const voltageDropPercent = (voltageDrop / voltage) * 100

      // If voltage drop is within limit, we found our wire
      if (voltageDrop <= maxAllowedVoltageDrop) {
        return {
          wireSize,
          groundSize: getGroundWireSize(amperage, conductorType as "copper" | "aluminum"),
          conduitSize: calculateConduitSize(wireSize, phase, includeNeutral, sets),
          sets,
          voltageDropPercent: Math.round(voltageDropPercent * 100) / 100,
          voltageDrop: Math.round(voltageDrop * 10) / 10,
          maxAmpacity: Math.round(adjustedAmpacity),
        }
      }
    }
  }

  return null
}

// ============================================================================
// NEC Table C.1 - Maximum number of THHN conductors in EMT
// Based on actual NEC Table C.1 for THHN, THWN, THWN-2
// Reference: Table_C.1-Maximum-Number-of-Conductors-in-EMT-.pdf
// Source: National Electrical Code (NEC) Article 300 Appendix C
// Wire type: THHN/THWN/THWN-2 in EMT conduit
// ============================================================================
const necTable_C1_THHN: Record<string, Record<string, number>> = {
  "14 AWG": { "1/2\"": 12, "3/4\"": 22, "1\"": 35, "1-1/4\"": 61, "1-1/2\"": 84, "2\"": 138, "2-1/2\"": 241, "3\"": 364, "3-1/2\"": 476, "4\"": 608 },
  "12 AWG": { "1/2\"": 9, "3/4\"": 16, "1\"": 26, "1-1/4\"": 45, "1-1/2\"": 61, "2\"": 101, "2-1/2\"": 176, "3\"": 266, "3-1/2\"": 347, "4\"": 443 },
  "10 AWG": { "1/2\"": 5, "3/4\"": 10, "1\"": 16, "1-1/4\"": 28, "1-1/2\"": 38, "2\"": 63, "2-1/2\"": 111, "3\"": 167, "3-1/2\"": 219, "4\"": 279 },
  "8 AWG": { "1/2\"": 3, "3/4\"": 6, "1\"": 9, "1-1/4\"": 16, "1-1/2\"": 22, "2\"": 36, "2-1/2\"": 64, "3\"": 96, "3-1/2\"": 126, "4\"": 161 },
  "6 AWG": { "1/2\"": 2, "3/4\"": 4, "1\"": 7, "1-1/4\"": 12, "1-1/2\"": 16, "2\"": 26, "2-1/2\"": 46, "3\"": 69, "3-1/2\"": 91, "4\"": 116 },
  "4 AWG": { "1/2\"": 1, "3/4\"": 2, "1\"": 4, "1-1/4\"": 7, "1-1/2\"": 10, "2\"": 16, "2-1/2\"": 28, "3\"": 43, "3-1/2\"": 56, "4\"": 71 },
  "3 AWG": { "1/2\"": 1, "3/4\"": 1, "1\"": 3, "1-1/4\"": 6, "1-1/2\"": 8, "2\"": 13, "2-1/2\"": 24, "3\"": 36, "3-1/2\"": 47, "4\"": 60 },
  "2 AWG": { "1/2\"": 1, "3/4\"": 1, "1\"": 3, "1-1/4\"": 5, "1-1/2\"": 7, "2\"": 11, "2-1/2\"": 20, "3\"": 30, "3-1/2\"": 40, "4\"": 51 },
  "1 AWG": { "1/2\"": 1, "3/4\"": 1, "1\"": 1, "1-1/4\"": 4, "1-1/2\"": 5, "2\"": 8, "2-1/2\"": 15, "3\"": 22, "3-1/2\"": 29, "4\"": 37 },
  "1/0 AWG": { "1/2\"": 1, "3/4\"": 1, "1\"": 1, "1-1/4\"": 3, "1-1/2\"": 4, "2\"": 7, "2-1/2\"": 12, "3\"": 19, "3-1/2\"": 25, "4\"": 32 },
  "2/0 AWG": { "1/2\"": 0, "3/4\"": 1, "1\"": 1, "1-1/4\"": 2, "1-1/2\"": 3, "2\"": 6, "2-1/2\"": 10, "3\"": 16, "3-1/2\"": 20, "4\"": 26 },
  "3/0 AWG": { "1/2\"": 0, "3/4\"": 1, "1\"": 1, "1-1/4\"": 1, "1-1/2\"": 3, "2\"": 5, "2-1/2\"": 8, "3\"": 13, "3-1/2\"": 17, "4\"": 22 },
  "4/0 AWG": { "1/2\"": 0, "3/4\"": 1, "1\"": 1, "1-1/4\"": 1, "1-1/2\"": 2, "2\"": 4, "2-1/2\"": 7, "3\"": 11, "3-1/2\"": 14, "4\"": 18 },
  "250 kcmil": { "1/2\"": 0, "3/4\"": 0, "1\"": 1, "1-1/4\"": 1, "1-1/2\"": 1, "2\"": 3, "2-1/2\"": 6, "3\"": 9, "3-1/2\"": 11, "4\"": 15 },
  "300 kcmil": { "1/2\"": 0, "3/4\"": 0, "1\"": 1, "1-1/4\"": 1, "1-1/2\"": 1, "2\"": 3, "2-1/2\"": 5, "3\"": 7, "3-1/2\"": 10, "4\"": 13 },
  "350 kcmil": { "1/2\"": 0, "3/4\"": 0, "1\"": 1, "1-1/4\"": 1, "1-1/2\"": 1, "2\"": 2, "2-1/2\"": 4, "3\"": 6, "3-1/2\"": 9, "4\"": 11 },
  "400 kcmil": { "1/2\"": 0, "3/4\"": 0, "1\"": 0, "1-1/4\"": 1, "1-1/2\"": 1, "2\"": 1, "2-1/2\"": 4, "3\"": 6, "3-1/2\"": 8, "4\"": 10 },
  "500 kcmil": { "1/2\"": 0, "3/4\"": 0, "1\"": 0, "1-1/4\"": 1, "1-1/2\"": 1, "2\"": 1, "2-1/2\"": 3, "3\"": 5, "3-1/2\"": 6, "4\"": 8 },
  "600 kcmil": { "1/2\"": 0, "3/4\"": 0, "1\"": 0, "1-1/4\"": 1, "1-1/2\"": 1, "2\"": 1, "2-1/2\"": 2, "3\"": 4, "3-1/2\"": 5, "4\"": 7 },
  "700 kcmil": { "1/2\"": 0, "3/4\"": 0, "1\"": 0, "1-1/4\"": 1, "1-1/2\"": 1, "2\"": 1, "2-1/2\"": 2, "3\"": 3, "3-1/2\"": 4, "4\"": 6 },
  "750 kcmil": { "1/2\"": 0, "3/4\"": 0, "1\"": 0, "1-1/4\"": 0, "1-1/2\"": 1, "2\"": 1, "2-1/2\"": 1, "3\"": 3, "3-1/2\"": 4, "4\"": 5 },
  "800 kcmil": { "1/2\"": 0, "3/4\"": 0, "1\"": 0, "1-1/4\"": 0, "1-1/2\"": 1, "2\"": 1, "2-1/2\"": 1, "3\"": 3, "3-1/2\"": 4, "4\"": 5 },
  "900 kcmil": { "1/2\"": 0, "3/4\"": 0, "1\"": 0, "1-1/4\"": 0, "1-1/2\"": 1, "2\"": 1, "2-1/2\"": 1, "3\"": 3, "3-1/2\"": 3, "4\"": 4 },
  "1000 kcmil": { "1/2\"": 0, "3/4\"": 0, "1\"": 0, "1-1/4\"": 0, "1-1/2\"": 1, "2\"": 1, "2-1/2\"": 1, "3\"": 2, "3-1/2\"": 3, "4\"": 4 },
}

const conduitSizes = ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '3-1/2"', '4"']

// ============================================================================
// Calculate conduit size based on NEC Table C.1 for THHN in EMT
// ============================================================================
function calculateConduitSize(wireSize: string, phase: "single" | "three", includeNeutral: boolean, numberOfSets: number): string {
  // Calculate total conductors: (phase wires × sets) + 1 ground + (neutral if applicable)
  const phaseWires = phase === "three" ? 3 : 1
  const neutralWires = includeNeutral ? 1 : 0
  const groundWires = 1
  const totalConductors = (phaseWires * numberOfSets) + groundWires + (neutralWires * numberOfSets)

  // Get the capacity table for this wire size
  const wireCapacity = necTable_C1_THHN[wireSize]
  if (!wireCapacity) {
    // Fallback for unknown wire sizes
    return '3"'
  }

  // Find minimum conduit size that fits all conductors
  let selectedConduit = '4"' // Default to largest
  for (const conduit of conduitSizes) {
    if (wireCapacity[conduit] >= totalConductors) {
      selectedConduit = conduit
      break
    }
  }

  // Upsize if conduit only allows exactly 3 phase wires
  // This is a safety measure to avoid tight fits
  if (phaseWires === 3) {
    const currentIndex = conduitSizes.indexOf(selectedConduit)
    const maxHotsInConduit = wireCapacity[selectedConduit]

    // If the conduit capacity is exactly 3 or slightly more, upsize
    if (maxHotsInConduit <= 4 && currentIndex < conduitSizes.length - 1) {
      selectedConduit = conduitSizes[currentIndex + 1]
    }
  }

  return selectedConduit
}

// ============================================================================
// Feeder schedule from "Feeder Schedule - Wire Size Chart 2026-06-01.xlsx"
// Source: User-provided reference chart for 3-phase 4-wire systems
// Note: Copper and Aluminum have different conduit sizes
// ============================================================================
const feederSchedule: Record<number, {
  copper: { size: string; sets: number; conduit: string } | { size: string; conduit: string }
  aluminum: { size: string; sets: number; conduit: string } | { size: string; conduit: string }
}> = {
  20: { copper: { size: "12 AWG", conduit: '3/4"' }, aluminum: { size: "—", conduit: "—" } },
  30: { copper: { size: "10 AWG", conduit: '3/4"' }, aluminum: { size: "—", conduit: "—" } },
  40: { copper: { size: "8 AWG", conduit: '1"' }, aluminum: { size: "—", conduit: "—" } },
  45: { copper: { size: "6 AWG", conduit: '1"' }, aluminum: { size: "—", conduit: "—" } },
  50: { copper: { size: "6 AWG", conduit: '1"' }, aluminum: { size: "—", conduit: "—" } },
  60: { copper: { size: "4 AWG", conduit: '1-1/4"' }, aluminum: { size: "—", conduit: "—" } },
  70: { copper: { size: "4 AWG", conduit: '1-1/4"' }, aluminum: { size: "—", conduit: "—" } },
  80: { copper: { size: "3 AWG", conduit: '1-1/4"' }, aluminum: { size: "—", conduit: "—" } },
  90: { copper: { size: "2 AWG", conduit: '1-1/4"' }, aluminum: { size: "—", conduit: "—" } },
  100: { copper: { size: "1 AWG", conduit: '1-1/2"' }, aluminum: { size: "1/0 AWG", conduit: '1-1/2"' } },
  110: { copper: { size: "1 AWG", conduit: '1-1/2"' }, aluminum: { size: "1/0 AWG", conduit: '2"' } },
  125: { copper: { size: "1 AWG", conduit: '1-1/2"' }, aluminum: { size: "2/0 AWG", conduit: '2"' } },
  150: { copper: { size: "1/0 AWG", conduit: '2"' }, aluminum: { size: "3/0 AWG", conduit: '2"' } },
  175: { copper: { size: "2/0 AWG", conduit: '2"' }, aluminum: { size: "4/0 AWG", conduit: '2"' } },
  200: { copper: { size: "3/0 AWG", conduit: '2"' }, aluminum: { size: "250 kcmil", sets: 1, conduit: '2-1/2"' } },
  225: { copper: { size: "4/0 AWG", conduit: '2-1/2"' }, aluminum: { size: "300 kcmil", sets: 1, conduit: '2-1/2"' } },
  250: { copper: { size: "250 kcmil", sets: 1, conduit: '2-1/2"' }, aluminum: { size: "350 kcmil", sets: 1, conduit: '2-1/2"' } },
  300: { copper: { size: "350 kcmil", sets: 1, conduit: '3"' }, aluminum: { size: "500 kcmil", sets: 1, conduit: '3"' } },
  350: { copper: { size: "500 kcmil", sets: 1, conduit: '3"' }, aluminum: { size: "700 kcmil", sets: 1, conduit: '3-1/2"' } },
  400: { copper: { size: "600 kcmil", sets: 1, conduit: '3-1/2"' }, aluminum: { size: "250 kcmil", sets: 2, conduit: '3"' } },
  450: { copper: { size: "4/0 AWG", sets: 2, conduit: '2"' }, aluminum: { size: "300 kcmil", sets: 2, conduit: '2-1/2"' } },
  500: { copper: { size: "250 kcmil", sets: 2, conduit: '2-1/2"' }, aluminum: { size: "350 kcmil", sets: 2, conduit: '2-1/2"' } },
  600: { copper: { size: "350 kcmil", sets: 2, conduit: '2-1/2"' }, aluminum: { size: "500 kcmil", sets: 2, conduit: '3"' } },
  700: { copper: { size: "500 kcmil", sets: 2, conduit: '3"' }, aluminum: { size: "700 kcmil", sets: 2, conduit: '3-1/2"' } },
  800: { copper: { size: "600 kcmil", sets: 2, conduit: '3-1/2"' }, aluminum: { size: "400 kcmil", sets: 3, conduit: '3"' } },
  1000: { copper: { size: "400 kcmil", sets: 3, conduit: '3"' }, aluminum: { size: "600 kcmil", sets: 3, conduit: '3-1/2"' } },
  1200: { copper: { size: "600 kcmil", sets: 3, conduit: '3-1/2"' }, aluminum: { size: "500 kcmil", sets: 4, conduit: '3"' } },
  1600: { copper: { size: "600 kcmil", sets: 4, conduit: '3-1/2"' }, aluminum: { size: "600 kcmil", sets: 5, conduit: '3-1/2"' } },
  2000: { copper: { size: "600 kcmil", sets: 5, conduit: '3-1/2"' }, aluminum: { size: "600 kcmil", sets: 6, conduit: '3-1/2"' } },
  2500: { copper: { size: "600 kcmil", sets: 6, conduit: '3-1/2"' }, aluminum: { size: "700 kcmil", sets: 7, conduit: '3-1/2"' } },
  3000: { copper: { size: "500 kcmil", sets: 8, conduit: '3-1/2"' }, aluminum: { size: "700 kcmil", sets: 8, conduit: '3-1/2"' } },
  3500: { copper: { size: "600 kcmil", sets: 9, conduit: '3-1/2"' }, aluminum: { size: "700 kcmil", sets: 10, conduit: '3-1/2"' } },
  4000: { copper: { size: "600 kcmil", sets: 10, conduit: '3-1/2"' }, aluminum: { size: "700 kcmil", sets: 11, conduit: '3-1/2"' } },
}

// ============================================================================
// Main calculation function - returns optimal wire sizing
// ============================================================================
export interface CalculationResult {
  wireSize: string
  groundWireSize: string
  conduitSize: string
  sets: number
  maxAmpacity: number
  maxLength: number // when no run length specified
  voltageDrop: number // when run length specified
  voltageAtLoad: number // when run length specified
  voltageDropPercent: number
  isOptimal: boolean
  exceedsLimit?: boolean
  isFailed?: boolean // true if wire size is undersized for the load
  fuseSize?: number // standard fuse size for OCPD
  quantityWires?: number // total number of wires (phase + ground + neutral)
}

export function calculateOptimalFeeder(
  amperage: number,
  conductorType: "copper" | "aluminum",
  tempRating: string,
  phase: "single" | "three",
  includeNeutral: boolean,
  voltage: number,
  maxVoltageDropPercent: number = 3,
  runLength: number | null = null,
  maxCopperWireSize: string = "600 kcmil",
  maxAluminumWireSize: string = "750 kcmil",
): CalculationResult {
  // Determine max wire size for this conductor type
  const maxWireSize = conductorType === "copper" ? maxCopperWireSize : maxAluminumWireSize
  // For 3-phase balanced loads, neutral is NOT a current-carrying conductor (zero current)
  // Only count actual current-carrying conductors for adjustment factors
  const conductorCount = phase === "three" ? 3 : (includeNeutral ? 2 : 1)

  // If run length provided, start with schedule wire and verify/adjust voltage drop
  if (runLength && runLength > 0) {
    const adjustmentFactor = getAdjustmentFactor(conductorCount)
    const requiredAmpacityAfterDerating = amperage / adjustmentFactor

    // CRITICAL: Find the schedule entry with the CLOSEST ampacity to the load
    // This ensures minimum oversizing for ANY input amperage (810A, 820A, 650A, etc.)
    const scheduleAmperages = Object.keys(feederSchedule).map(Number).sort((a, b) => a - b)
    let bestMatch = { amperage: 0, ampacity: Infinity, schedule: null as any }

    for (const schedAmp of scheduleAmperages) {
      const scheduleEntry = feederSchedule[schedAmp]
      if (!scheduleEntry) continue

      // Get the conductor config for this specific conductor type
      const condConfig = scheduleEntry[conductorType === "copper" ? "copper" : "aluminum"]
      if (!condConfig || typeof condConfig === "string" || condConfig.size === "—") continue

      // Extract wire size and sets from config
      const wireSize = (condConfig as any).size
      const sets = (condConfig as any).sets || 1

      // Calculate the ACTUAL ampacity this schedule entry provides
      const baseAmp = getAmpacity(wireSize, conductorType, tempRating)
      if (baseAmp === 0) continue

      const adjustedAmp = baseAmp * adjustmentFactor
      const totalAmpacity = adjustedAmp * sets

      // Check if this schedule entry CAN handle the load
      if (totalAmpacity >= amperage) {
        // If this is closer to the load than our current best, use it
        if (totalAmpacity < bestMatch.ampacity) {
          bestMatch = {
            amperage: schedAmp,
            ampacity: totalAmpacity,
            schedule: scheduleEntry,
          }
        }
      }
    }

    const targetAmperage = bestMatch.amperage
    const schedule = bestMatch.schedule
    if (!schedule) {
      return {
        wireSize: "—",
        groundWireSize: "—",
        conduitSize: "—",
        sets: 1,
        maxAmpacity: 0,
        maxLength: 0,
        voltageDrop: 0,
        voltageAtLoad: 0,
        voltageDropPercent: 0,
        isOptimal: false,
        isFailed: true,
        fuseSize: getFuseSize(amperage),
        quantityWires: calculateQuantityWires(phase, includeNeutral, 1),
      }
    }

    // Extract wire size and sets from conductor-specific config
    const conductorConfig = schedule[conductorType === "copper" ? "copper" : "aluminum"]
    let wireSize: string
    let sets: number

    if (typeof conductorConfig === "object" && conductorConfig !== null && "size" in conductorConfig) {
      // New format: { size: "600 kcmil", sets: 5 }
      wireSize = conductorConfig.size
      sets = conductorConfig.sets
    } else {
      // Old format (fallback): just a string like "600 kcmil"
      wireSize = conductorConfig as string
      sets = (schedule as any).sets || 1
    }
    const currentPerSet = amperage / sets
    const maxAllowedVD = (voltage * maxVoltageDropPercent) / 100

    // Adjust wire size if voltage drop exceeds limit
    let currentWireSizeIndex = wireSizesOrdered.indexOf(wireSize)
    const maxWireSizeIndex = wireSizesOrdered.indexOf(maxWireSize)
    let voltageDrop = calculateVoltageDrop(currentPerSet, wireSize, runLength, voltage, phase, conductorType)

    // Keep going up one size at a time until VD is within limit (but don't exceed max wire size)
    while (voltageDrop > maxAllowedVD && currentWireSizeIndex < Math.min(maxWireSizeIndex, wireSizesOrdered.length - 1)) {
      currentWireSizeIndex++
      wireSize = wireSizesOrdered[currentWireSizeIndex]
      voltageDrop = calculateVoltageDrop(currentPerSet, wireSize, runLength, voltage, phase, conductorType)
    }

    let voltageDropPercent = (voltageDrop / voltage) * 100

    // Get final ampacity and voltage at load
    const baseAmpacity = getAmpacity(wireSize, conductorType, tempRating)
    const adjustedAmpacity = baseAmpacity * adjustmentFactor
    const totalAmpacity = adjustedAmpacity * sets
    const voltageAtLoad = voltage - voltageDrop
    const isFailed = totalAmpacity < amperage // Check if wire is undersized

    return {
      wireSize,
      groundWireSize: getGroundWireSize(amperage, conductorType as "copper" | "aluminum"),
      conduitSize: calculateConduitSize(wireSize, phase, includeNeutral, sets),
      sets,
      maxAmpacity: Math.round(totalAmpacity),
      maxLength: 0,
      voltageDrop: Math.round(voltageDrop * 10) / 10,
      voltageAtLoad: Math.round(voltageAtLoad * 10) / 10,
      voltageDropPercent: Math.round(voltageDropPercent * 100) / 100,
      isOptimal: true,
      isFailed,
      fuseSize: getFuseSize(amperage),
      quantityWires: calculateQuantityWires(phase, includeNeutral, sets),
    }
  }

  // No run length: find wire size from standard amperage schedule
  // The feeder schedule is for feeders >= 2000A with max wire sizes (600 kcmil Cu, 750 kcmil Al)
  // For smaller amperages, cannot use this schedule (would recommend massive overkill)
  const adjustmentFactor = getAdjustmentFactor(conductorCount)
  const requiredAmpacityAfterDerating = amperage / adjustmentFactor

  const scheduleAmperages = Object.keys(feederSchedule).map(Number).sort((a, b) => a - b)
  const minScheduleAmperage = scheduleAmperages[0] // 2000A

  // If amperage is below minimum schedule entry, use NEC 310.16 to find best wire size
  if (amperage < minScheduleAmperage) {
    const bestWire = findBestWireSizeFromNEC(amperage, conductorType, tempRating, maxWireSize)
    if (!bestWire) {
      return {
        wireSize: "—",
        groundWireSize: "—",
        conduitSize: "—",
        sets: 1,
        maxAmpacity: 0,
        maxLength: 0,
        voltageDrop: 0,
        voltageAtLoad: voltage,
        voltageDropPercent: 0,
        isOptimal: false,
        isFailed: true,
        fuseSize: getFuseSize(amperage),
        quantityWires: calculateQuantityWires(phase, includeNeutral, 1),
      }
    }

    const wireSize = bestWire.wireSize
    const sets = 1
    const baseAmpacity = bestWire.ampacity
    const adjustedAmpacity = baseAmpacity * adjustmentFactor
    const totalAmpacity = adjustedAmpacity * sets

    return {
      wireSize,
      groundWireSize: getGroundWireSize(amperage, conductorType as "copper" | "aluminum"),
      conduitSize: calculateConduitSize(wireSize, conductorCount),
      sets,
      maxAmpacity: Math.round(totalAmpacity),
      maxLength: calculateMaxLength(amperage, wireSize, voltage, phase, conductorType, maxVoltageDropPercent),
      voltageDrop: 0,
      voltageAtLoad: voltage,
      voltageDropPercent: 0,
      isOptimal: true,
      isFailed: totalAmpacity < amperage,
      fuseSize: getFuseSize(amperage),
      quantityWires: calculateQuantityWires(phase, includeNeutral, sets),
    }
  }

  // CRITICAL: Find the schedule entry with the CLOSEST ampacity to the load
  // This ensures minimum oversizing for ANY input amperage (810A, 820A, 650A, etc.)
  let bestMatch = { amperage: 0, ampacity: Infinity, schedule: null as any }

  for (const schedAmp of scheduleAmperages) {
    const scheduleEntry = feederSchedule[schedAmp]
    if (!scheduleEntry) continue

    // Get the conductor config for this specific conductor type
    const condConfig = scheduleEntry[conductorType === "copper" ? "copper" : "aluminum"]
    if (!condConfig || typeof condConfig === "string" || condConfig.size === "—") continue

    // Extract wire size and sets from config
    const wireSize = (condConfig as any).size
    const sets = (condConfig as any).sets || 1
    const conduit = (condConfig as any).conduit

    // Calculate the ACTUAL ampacity this schedule entry provides
    const baseAmp = getAmpacity(wireSize, conductorType, tempRating)
    if (baseAmp === 0) continue

    const adjustedAmp = baseAmp * adjustmentFactor
    const totalAmpacity = adjustedAmp * sets

    // Check if this schedule entry CAN handle the load
    if (totalAmpacity >= amperage) {
      // If this is closer to the load than our current best, use it
      // "Closer" means smaller oversizing (totalAmpacity closer to amperage)
      if (totalAmpacity < bestMatch.ampacity) {
        bestMatch = {
          amperage: schedAmp,
          ampacity: totalAmpacity,
          schedule: scheduleEntry,
        }
      }
    }
  }

  // Use the closest matching schedule entry
  const targetAmperage = bestMatch.amperage
  const schedule = bestMatch.schedule
  if (!schedule) {
    return {
      wireSize: "—",
      groundWireSize: "—",
      conduitSize: "—",
      sets: 1,
      maxAmpacity: 0,
      maxLength: 0,
      voltageDrop: 0,
      voltageAtLoad: voltage,
      voltageDropPercent: 0,
      isOptimal: false,
      isFailed: true,
      fuseSize: getFuseSize(amperage),
      quantityWires: calculateQuantityWires(phase, includeNeutral, 1),
    }
  }

  // Extract wire size, sets, and conduit from conductor-specific config
  const conductorConfig = schedule[conductorType === "copper" ? "copper" : "aluminum"]
  let wireSize: string
  let sets: number
  let scheduleConduit: string = '3"' // fallback

  if (typeof conductorConfig === "object" && conductorConfig !== null && "size" in conductorConfig) {
    // New format with separate conduit: { size: "600 kcmil", sets: 5, conduit: "3-1/2\"" }
    wireSize = conductorConfig.size
    sets = (conductorConfig as any).sets || 1
    scheduleConduit = (conductorConfig as any).conduit || '3"'
  } else {
    // Old format (fallback): just a string like "600 kcmil"
    wireSize = conductorConfig as string
    sets = 1
  }

  const maxWireSizeIndex = wireSizesOrdered.indexOf(maxWireSize)
  let selectedWireSizeIndex = wireSizesOrdered.indexOf(wireSize)

  // Check if selected wire size exceeds max allowed
  if (selectedWireSizeIndex > maxWireSizeIndex && maxWireSizeIndex >= 0) {
    wireSize = maxWireSize
    selectedWireSizeIndex = maxWireSizeIndex

    // Calculate how many sets we need with the max allowed wire size
    const baseAmpacity = getAmpacity(wireSize, conductorType, tempRating)
    const adjustedAmpacity = baseAmpacity * adjustmentFactor
    const setsNeeded = Math.ceil(amperage / adjustedAmpacity)

    if (setsNeeded <= 6) {
      sets = setsNeeded
    } else {
      return {
        wireSize: "—",
        groundWireSize: "—",
        conduitSize: "—",
        sets: 1,
        maxAmpacity: 0,
        maxLength: 0,
        voltageDrop: 0,
        voltageAtLoad: voltage,
        voltageDropPercent: 0,
        isOptimal: false,
        isFailed: true,
        fuseSize: getFuseSize(amperage),
        quantityWires: calculateQuantityWires(phase, includeNeutral, 1),
      }
    }
  }

  let baseAmpacity = getAmpacity(wireSize, conductorType, tempRating)
  let adjustedAmpacity = baseAmpacity * adjustmentFactor

  // Use the wire size and sets directly from the feeder schedule
  let totalAmpacity = adjustedAmpacity * sets

  // CRITICAL: If feeder schedule result is undersized, upgrade wire size or add sets
  let isFailed = totalAmpacity < amperage
  if (isFailed) {
    // Try upgrading wire size first (more efficient than adding sets)
    const currentWireSizeIndex = wireSizesOrdered.indexOf(wireSize)
    let foundBetterWire = false

    for (let i = currentWireSizeIndex + 1; i < wireSizesOrdered.length; i++) {
      const nextWireSize = wireSizesOrdered[i]
      const nextIndex = wireSizesOrdered.indexOf(nextWireSize)

      // Don't exceed max wire size constraint
      if (nextIndex > maxWireSizeIndex && maxWireSizeIndex >= 0) break

      const nextBaseAmpacity = getAmpacity(nextWireSize, conductorType, tempRating)
      const nextAdjustedAmpacity = nextBaseAmpacity * adjustmentFactor
      const nextTotalAmpacity = nextAdjustedAmpacity * sets

      if (nextTotalAmpacity >= amperage) {
        wireSize = nextWireSize
        baseAmpacity = nextBaseAmpacity
        adjustedAmpacity = nextAdjustedAmpacity
        totalAmpacity = nextTotalAmpacity
        isFailed = false
        foundBetterWire = true
        break
      }
    }

    // If upgrading wire didn't work, add more sets
    if (!foundBetterWire) {
      const setsNeeded = Math.ceil(amperage / adjustedAmpacity)
      if (setsNeeded <= 6) {
        sets = setsNeeded
        totalAmpacity = adjustedAmpacity * sets
        isFailed = totalAmpacity < amperage
      }
    }
  }

  const maxLength = calculateMaxLength(
    amperage / sets,
    wireSize,
    voltage,
    phase,
    conductorType,
    maxVoltageDropPercent,
  )

  return {
    wireSize,
    groundWireSize: getGroundWireSize(amperage, conductorType as "copper" | "aluminum"),
    conduitSize: scheduleConduit, // Use feeder schedule conduit size (conductor type specific)
    sets,
    maxAmpacity: Math.round(totalAmpacity),
    maxLength,
    voltageDrop: 0,
    voltageAtLoad: voltage,
    voltageDropPercent: 0,
    isOptimal: false,
    isFailed,
    fuseSize: getFuseSize(amperage),
    quantityWires: calculateQuantityWires(phase, includeNeutral, sets),
  }
}

// ============================================================================
// Calculate both Industry Standard (feeder schedule) AND Optimized (best fit) results
// Returns dual results for display in 2x2 grid
// ============================================================================
export interface DualCalculationResults {
  industryStandard: CalculationResult
  optimized: CalculationResult
}

export function calculateDualResults(
  amperage: number,
  conductorType: "copper" | "aluminum",
  tempRating: string,
  phase: "single" | "three",
  includeNeutral: boolean,
  voltage: number,
  maxVoltageDropPercent: number = 3,
  runLength: number | null = null,
  maxCopperWireSize: string = "600 kcmil",
  maxAluminumWireSize: string = "750 kcmil",
): DualCalculationResults {
  // Calculate Industry Standard (feeder schedule based)
  const industryStandard = calculateOptimalFeeder(
    amperage,
    conductorType,
    tempRating,
    phase,
    includeNeutral,
    voltage,
    maxVoltageDropPercent,
    runLength,
    maxCopperWireSize,
    maxAluminumWireSize
  )

  // Calculate Optimized (best fit - minimum oversizing) using findOptimalConfiguration
  const adjustmentFactor = getAdjustmentFactor(phase === "three" ? 3 : (includeNeutral ? 2 : 1))
  const maxWireSize = conductorType === "copper" ? maxCopperWireSize : maxAluminumWireSize
  const optimalConfig = findOptimalConfiguration(amperage, conductorType, tempRating, adjustmentFactor, maxWireSize)

  let optimized: CalculationResult
  if (!optimalConfig) {
    // Fallback to industry standard if no optimal config found
    optimized = industryStandard
  } else {
    const baseAmpacity = getAmpacity(optimalConfig.wireSize, conductorType, tempRating)
    const adjustedAmpacity = baseAmpacity * adjustmentFactor
    const maxLength = calculateMaxLength(
      amperage / optimalConfig.sets,
      optimalConfig.wireSize,
      voltage,
      phase,
      conductorType,
      maxVoltageDropPercent
    )

    optimized = {
      wireSize: optimalConfig.wireSize,
      groundWireSize: getGroundWireSize(amperage, conductorType as "copper" | "aluminum"),
      conduitSize: calculateConduitSize(optimalConfig.wireSize, phase, includeNeutral, optimalConfig.sets),
      sets: optimalConfig.sets,
      maxAmpacity: Math.round(optimalConfig.totalAmpacity),
      maxLength,
      voltageDrop: 0,
      voltageAtLoad: voltage,
      voltageDropPercent: 0,
      isOptimal: true,
      isFailed: optimalConfig.totalAmpacity < amperage,
      fuseSize: getFuseSize(amperage),
      quantityWires: calculateQuantityWires(phase, includeNeutral, optimalConfig.sets),
    }
  }

  return { industryStandard, optimized }
}

// ============================================================================
// Calculate results for manually selected wire size
// ============================================================================
export function calculateManualWireResult(
  amperage: number,
  wireSize: string,
  numberOfSets: number,
  conductorType: "copper" | "aluminum",
  tempRating: string,
  phase: "single" | "three",
  includeNeutral: boolean,
  voltage: number,
  runLength: number | null,
  maxCopperWireSize: string = "600 kcmil",
  maxAluminumWireSize: string = "750 kcmil",
): CalculationResult {
  const conductorCount = phase === "three" ? 3 : (includeNeutral ? 2 : 1)
  const adjustmentFactor = getAdjustmentFactor(conductorCount)
  const currentPerSet = amperage / numberOfSets

  const baseAmpacity = getAmpacity(wireSize, conductorType, tempRating)
  const adjustedAmpacity = baseAmpacity * adjustmentFactor
  const totalAmpacity = adjustedAmpacity * numberOfSets

  // Check if wire is undersized for the load
  const isFailed = totalAmpacity < amperage

  // Auto-calculate conduit size
  const conduitSize = calculateConduitSize(wireSize, phase, includeNeutral, numberOfSets)

  if (runLength && runLength > 0) {
    const voltageDrop = calculateVoltageDrop(currentPerSet, wireSize, runLength, voltage, phase, conductorType)
    const voltageDropPercent = (voltageDrop / voltage) * 100
    const voltageAtLoad = voltage - voltageDrop

    return {
      wireSize,
      groundWireSize: getGroundWireSize(amperage, conductorType as "copper" | "aluminum"),
      conduitSize,
      sets: numberOfSets,
      maxAmpacity: Math.round(totalAmpacity),
      maxLength: 0,
      voltageDrop: Math.round(voltageDrop * 10) / 10,
      voltageAtLoad: Math.round(voltageAtLoad * 10) / 10,
      voltageDropPercent: Math.round(voltageDropPercent * 100) / 100,
      isOptimal: true,
      isFailed,
      fuseSize: getFuseSize(amperage),
      quantityWires: calculateQuantityWires(phase, includeNeutral, numberOfSets),
    }
  }

  const maxLength = calculateMaxLength(
    currentPerSet,
    wireSize,
    voltage,
    phase,
    conductorType,
    3, // default 3% VD for max length calculation
  )

  return {
    wireSize,
    groundWireSize: getGroundWireSize(amperage, conductorType as "copper" | "aluminum"),
    conduitSize,
    sets: numberOfSets,
    maxAmpacity: Math.round(totalAmpacity),
    maxLength,
    voltageDrop: 0,
    voltageAtLoad: voltage,
    voltageDropPercent: 0,
    isOptimal: false,
    isFailed,
    fuseSize: getFuseSize(amperage),
    quantityWires: calculateQuantityWires(phase, includeNeutral, numberOfSets),
  }
}

// ============================================================================
// Validation
// ============================================================================
export function validateInputs(
  amperage: number,
  voltage: number,
  runLength: number | null,
): string[] {
  const errors: string[] = []

  if (amperage < 1 || amperage > 4000) {
    errors.push("Amperage must be between 1A and 4000A")
  }

  if (![120, 208, 240, 277, 480, 600].includes(voltage)) {
    errors.push("Voltage must be a standard value (120, 208, 240, 277, 480, or 600V)")
  }

  if (runLength !== null && (runLength < 0 || runLength > 10000)) {
    errors.push("Run length must be between 0 and 10,000 feet")
  }

  return errors
}
