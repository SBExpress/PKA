// NEC Reference Tables for Wire and Conduit Sizing
// Based on 2023 NEC (National Electrical Code)

// ============================================================================
// NEC TABLE 310.16 - Allowable Ampacities of Insulated Conductors
// ============================================================================

export interface AmpacityRow {
  wireSize: string
  copper60C: number
  copper75C: number
  copper90C: number
  aluminum60C: number
  aluminum75C: number
  aluminum90C: number
}

export const NEC_310_16: AmpacityRow[] = [
  // Official NEC 2020 Edition Table 310.16 - Verified from LugsDirect.com
  { wireSize: "14 AWG", copper60C: 15, copper75C: 20, copper90C: 25, aluminum60C: 0, aluminum75C: 0, aluminum90C: 0 },
  { wireSize: "12 AWG", copper60C: 20, copper75C: 25, copper90C: 30, aluminum60C: 15, aluminum75C: 20, aluminum90C: 25 },
  { wireSize: "10 AWG", copper60C: 30, copper75C: 35, copper90C: 40, aluminum60C: 25, aluminum75C: 30, aluminum90C: 35 },
  { wireSize: "8 AWG", copper60C: 40, copper75C: 50, copper90C: 55, aluminum60C: 35, aluminum75C: 40, aluminum90C: 45 },
  { wireSize: "6 AWG", copper60C: 55, copper75C: 65, copper90C: 75, aluminum60C: 40, aluminum75C: 50, aluminum90C: 55 },
  { wireSize: "4 AWG", copper60C: 70, copper75C: 85, copper90C: 95, aluminum60C: 55, aluminum75C: 65, aluminum90C: 75 },
  { wireSize: "3 AWG", copper60C: 85, copper75C: 100, copper90C: 115, aluminum60C: 65, aluminum75C: 75, aluminum90C: 85 },
  { wireSize: "2 AWG", copper60C: 95, copper75C: 115, copper90C: 130, aluminum60C: 75, aluminum75C: 90, aluminum90C: 100 },
  { wireSize: "1 AWG", copper60C: 110, copper75C: 130, copper90C: 145, aluminum60C: 85, aluminum75C: 100, aluminum90C: 115 },
  { wireSize: "1/0 AWG", copper60C: 125, copper75C: 150, copper90C: 170, aluminum60C: 100, aluminum75C: 120, aluminum90C: 135 },
  { wireSize: "2/0 AWG", copper60C: 145, copper75C: 175, copper90C: 195, aluminum60C: 115, aluminum75C: 135, aluminum90C: 150 },
  { wireSize: "3/0 AWG", copper60C: 165, copper75C: 200, copper90C: 225, aluminum60C: 130, aluminum75C: 155, aluminum90C: 175 },
  { wireSize: "4/0 AWG", copper60C: 195, copper75C: 230, copper90C: 260, aluminum60C: 150, aluminum75C: 180, aluminum90C: 205 },
  { wireSize: "250 kcmil", copper60C: 215, copper75C: 255, copper90C: 290, aluminum60C: 170, aluminum75C: 205, aluminum90C: 230 },
  { wireSize: "300 kcmil", copper60C: 240, copper75C: 285, copper90C: 320, aluminum60C: 195, aluminum75C: 230, aluminum90C: 260 },
  { wireSize: "350 kcmil", copper60C: 260, copper75C: 310, copper90C: 350, aluminum60C: 210, aluminum75C: 250, aluminum90C: 280 },
  { wireSize: "400 kcmil", copper60C: 280, copper75C: 335, copper90C: 380, aluminum60C: 225, aluminum75C: 270, aluminum90C: 305 },
  { wireSize: "500 kcmil", copper60C: 320, copper75C: 380, copper90C: 430, aluminum60C: 260, aluminum75C: 310, aluminum90C: 350 },
  { wireSize: "600 kcmil", copper60C: 350, copper75C: 420, copper90C: 475, aluminum60C: 285, aluminum75C: 340, aluminum90C: 385 },
  { wireSize: "700 kcmil", copper60C: 385, copper75C: 460, copper90C: 520, aluminum60C: 315, aluminum75C: 375, aluminum90C: 425 },
  { wireSize: "750 kcmil", copper60C: 400, copper75C: 475, copper90C: 535, aluminum60C: 320, aluminum75C: 385, aluminum90C: 435 },
  { wireSize: "800 kcmil", copper60C: 410, copper75C: 490, copper90C: 555, aluminum60C: 330, aluminum75C: 395, aluminum90C: 445 },
  { wireSize: "900 kcmil", copper60C: 435, copper75C: 520, copper90C: 585, aluminum60C: 355, aluminum75C: 425, aluminum90C: 480 },
  { wireSize: "1000 kcmil", copper60C: 455, copper75C: 545, copper90C: 615, aluminum60C: 375, aluminum75C: 445, aluminum90C: 500 },
  { wireSize: "1250 kcmil", copper60C: 495, copper75C: 590, copper90C: 665, aluminum60C: 405, aluminum75C: 485, aluminum90C: 545 },
  { wireSize: "1500 kcmil", copper60C: 525, copper75C: 625, copper90C: 705, aluminum60C: 435, aluminum75C: 520, aluminum90C: 585 },
  { wireSize: "1750 kcmil", copper60C: 545, copper75C: 650, copper90C: 735, aluminum60C: 455, aluminum75C: 545, aluminum90C: 615 },
  { wireSize: "2000 kcmil", copper60C: 555, copper75C: 665, copper90C: 750, aluminum60C: 470, aluminum75C: 560, aluminum90C: 630 },
]

// ============================================================================
// NEC TABLE 250.122 - Minimum Size Equipment Grounding Conductors
// ============================================================================

export interface GroundingRow {
  protectionDeviceRating: string
  copperAWG: string
  aluminumAWG: string
}

export const NEC_250_122: GroundingRow[] = [
  // Official NEC 2020 Edition Table 250.122 - Verified from user's source
  { protectionDeviceRating: "15 A", copperAWG: "14 AWG", aluminumAWG: "12 AWG" },
  { protectionDeviceRating: "20 A", copperAWG: "12 AWG", aluminumAWG: "10 AWG" },
  { protectionDeviceRating: "60 A", copperAWG: "10 AWG", aluminumAWG: "8 AWG" },
  { protectionDeviceRating: "100 A", copperAWG: "8 AWG", aluminumAWG: "6 AWG" },
  { protectionDeviceRating: "200 A", copperAWG: "6 AWG", aluminumAWG: "4 AWG" },
  { protectionDeviceRating: "300 A", copperAWG: "4 AWG", aluminumAWG: "2 AWG" },
  { protectionDeviceRating: "400 A", copperAWG: "3 AWG", aluminumAWG: "1 AWG" },
  { protectionDeviceRating: "500 A", copperAWG: "2 AWG", aluminumAWG: "1/0 AWG" },
  { protectionDeviceRating: "600 A", copperAWG: "1 AWG", aluminumAWG: "2/0 AWG" },
  { protectionDeviceRating: "800 A", copperAWG: "1/0 AWG", aluminumAWG: "3/0 AWG" },
  { protectionDeviceRating: "1000 A", copperAWG: "2/0 AWG", aluminumAWG: "4/0 AWG" },
  { protectionDeviceRating: "1200 A", copperAWG: "3/0 AWG", aluminumAWG: "250 kcmil" },
  { protectionDeviceRating: "1600 A", copperAWG: "4/0 AWG", aluminumAWG: "350 kcmil" },
  { protectionDeviceRating: "2000 A", copperAWG: "250 kcmil", aluminumAWG: "400 kcmil" },
  { protectionDeviceRating: "2500 A", copperAWG: "350 kcmil", aluminumAWG: "600 kcmil" },
  { protectionDeviceRating: "3000 A", copperAWG: "400 kcmil", aluminumAWG: "600 kcmil" },
  { protectionDeviceRating: "4000 A", copperAWG: "500 kcmil", aluminumAWG: "750 kcmil" },
  { protectionDeviceRating: "5000 A", copperAWG: "700 kcmil", aluminumAWG: "1200 kcmil" },
  { protectionDeviceRating: "6000 A", copperAWG: "800 kcmil", aluminumAWG: "1200 kcmil" },
]

// ============================================================================
// NEC ANNEX C - Conduit Fill (Three tables: EMT, PVC, Rigid)
// ============================================================================

export interface ConduitFillRow {
  conduitSize: string
  oneWire: number // 53% fill
  twoWires: number // 31% fill
  threeWires: number // 40% fill
  fourOrMore: number // 40% fill
}

export const NEC_ANNEX_C_EMT: ConduitFillRow[] = [
  // Official NEC Chapter 9 Table 4 - EMT Conduit Fill Areas (square inches)
  // 53% fill (1 wire), 31% fill (2 wires), 40% fill (3+ wires)
  { conduitSize: '1/2"', oneWire: 0.161, twoWires: 0.094, threeWires: 0.122, fourOrMore: 0.122 },
  { conduitSize: '3/4"', oneWire: 0.283, twoWires: 0.165, threeWires: 0.213, fourOrMore: 0.213 },
  { conduitSize: '1"', oneWire: 0.458, twoWires: 0.268, threeWires: 0.346, fourOrMore: 0.346 },
  { conduitSize: '1-1/4"', oneWire: 0.793, twoWires: 0.464, threeWires: 0.598, fourOrMore: 0.598 },
  { conduitSize: '1-1/2"', oneWire: 1.079, twoWires: 0.631, threeWires: 0.814, fourOrMore: 0.814 },
  { conduitSize: '2"', oneWire: 1.778, twoWires: 1.040, threeWires: 1.342, fourOrMore: 1.342 },
  { conduitSize: '2-1/2"', oneWire: 3.105, twoWires: 1.816, threeWires: 2.343, fourOrMore: 2.343 },
  { conduitSize: '3"', oneWire: 4.688, twoWires: 2.742, threeWires: 3.538, fourOrMore: 3.538 },
  { conduitSize: '3-1/2"', oneWire: 6.119, twoWires: 3.579, threeWires: 4.618, fourOrMore: 4.618 },
  { conduitSize: '4"', oneWire: 7.819, twoWires: 4.573, threeWires: 5.901, fourOrMore: 5.901 },
]

// ============================================================================
// NEC 310.15(B)(2) - Adjustment Factors for More Than 3 Conductors
// ============================================================================

export interface AdjustmentFactor {
  conductorCount: string
  factor: number
}

export const NEC_310_15_B_2_ADJUSTMENT: AdjustmentFactor[] = [
  { conductorCount: "1-3", factor: 1.0 },
  { conductorCount: "4-6", factor: 0.8 },
  { conductorCount: "7-9", factor: 0.7 },
  { conductorCount: "10-20", factor: 0.5 },
  { conductorCount: "21-30", factor: 0.45 },
  { conductorCount: "31-40", factor: 0.4 },
  { conductorCount: "41+", factor: 0.35 },
]

// ============================================================================
// NEC 310.15(B)(2)(i) - Temperature Ambient Adjustment
// ============================================================================

export interface TemperatureAdjustment {
  ambientTemp: string
  factor60C: number
  factor75C: number
  factor90C: number
}

export const NEC_310_15_AMBIENT_TEMP: TemperatureAdjustment[] = [
  // Official NEC 2020 Table 310.15(B)(2)(a) - Ambient Temperature Correction Factors
  { ambientTemp: "10°C or less (50°F or less)", factor60C: 1.29, factor75C: 1.20, factor90C: 1.15 },
  { ambientTemp: "11-15°C (51-59°F)", factor60C: 1.22, factor75C: 1.15, factor90C: 1.12 },
  { ambientTemp: "16-20°C (60-68°F)", factor60C: 1.15, factor75C: 1.11, factor90C: 1.08 },
  { ambientTemp: "21-25°C (69-77°F)", factor60C: 1.08, factor75C: 1.05, factor90C: 1.04 },
  { ambientTemp: "26-30°C (78-86°F)", factor60C: 1.0, factor75C: 1.0, factor90C: 1.0 },
  { ambientTemp: "31-35°C (87-95°F)", factor60C: 0.91, factor75C: 0.94, factor90C: 0.96 },
  { ambientTemp: "36-40°C (96-104°F)", factor60C: 0.82, factor75C: 0.88, factor90C: 0.91 },
  { ambientTemp: "41-45°C (105-113°F)", factor60C: 0.71, factor75C: 0.82, factor90C: 0.87 },
  { ambientTemp: "46-50°C (114-122°F)", factor60C: 0.58, factor75C: 0.75, factor90C: 0.82 },
  { ambientTemp: "51-55°C (123-131°F)", factor60C: 0.41, factor75C: 0.67, factor90C: 0.76 },
  { ambientTemp: "56-60°C (132-140°F)", factor60C: 0, factor75C: 0.58, factor90C: 0.71 },
  { ambientTemp: "61-65°C (141-149°F)", factor60C: 0, factor75C: 0.47, factor90C: 0.65 },
  { ambientTemp: "66-70°C (150-158°F)", factor60C: 0, factor75C: 0.33, factor90C: 0.58 },
  { ambientTemp: "71-75°C (159-167°F)", factor60C: 0, factor75C: 0, factor90C: 0.50 },
  { ambientTemp: "76-80°C (168-176°F)", factor60C: 0, factor75C: 0, factor90C: 0.41 },
  { ambientTemp: "81-85°C (177-185°F)", factor60C: 0, factor75C: 0, factor90C: 0.29 },
]

// ============================================================================
// Chapter 9, Table 1 - Percent of Conduit Fill
// ============================================================================

export const CONDUIT_FILL_PERCENTAGES = {
  description: "Maximum percent of conduit or tubing fill",
  oneWire: "53%",
  twoWires: "31%",
  threeOrMore: "40%",
  note: "For combinations of cables and wires, see 392.22(B)",
}

// ============================================================================
// Quick Reference - Common Feeder Sizes
// ============================================================================

export interface CommonFeederSize {
  amperage: number
  copper: string
  aluminum: string
  conduit: string
  groundWire: string
}

export const COMMON_FEEDER_SIZES: CommonFeederSize[] = [
  { amperage: 20, copper: "#12 AWG", aluminum: "#10 AWG", conduit: '3/4"', groundWire: "#12 AWG" },
  { amperage: 30, copper: "#10 AWG", aluminum: "#8 AWG", conduit: '3/4"-1"', groundWire: "#10 AWG" },
  { amperage: 40, copper: "#8 AWG", aluminum: "#6 AWG", conduit: '1"', groundWire: "#10 AWG" },
  { amperage: 50, copper: "#6 AWG", aluminum: "#4 AWG", conduit: '1"-1-1/4"', groundWire: "#10 AWG" },
  { amperage: 60, copper: "#4 AWG", aluminum: "#3 AWG", conduit: '1-1/4"', groundWire: "#10 AWG" },
  { amperage: 100, copper: "#1 AWG", aluminum: "#2/0 AWG", conduit: '1-1/2"-2"', groundWire: "#8 AWG" },
  { amperage: 125, copper: "#1/0 AWG", aluminum: "#3/0 AWG", conduit: '2"', groundWire: "#6 AWG" },
  { amperage: 200, copper: "#4/0 AWG", aluminum: "#300 kcmil", conduit: '2-1/2"', groundWire: "#4 AWG" },
]

// ============================================================================
// Standard Fuse Sizes (NEC) - for OCPD Selection
// ============================================================================

export function getFuseSize(amperage: number): number {
  // Standard fuse sizes per NEC - covers 15A through 6000A
  const standardFuses = [
    15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250,
    300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000
  ]

  // Find the smallest fuse that can handle this amperage
  for (const fuse of standardFuses) {
    if (amperage <= fuse) {
      return fuse
    }
  }

  // If amperage exceeds the largest standard fuse (6000A), return 6000A
  return 6000
}
