// Feeder schedule data structure
interface FeederConfig {
  copper: {
    wireSize: string
    groundSize: string
    conduitSize: string
    sets?: number
  }
  aluminum: {
    wireSize: string
    groundSize: string
    conduitSize: string
    sets?: number
  }
}

// Wire sizes in order from smallest to largest
const wireSizesOrdered = [
  "14 AWG", "12 AWG", "10 AWG", "8 AWG", "6 AWG", "4 AWG", "3 AWG", "2 AWG", "1 AWG",
  "1/0 AWG", "2/0 AWG", "3/0 AWG", "4/0 AWG",
  "250 kcmil", "300 kcmil", "350 kcmil", "400 kcmil", "500 kcmil", "600 kcmil", "700 kcmil", "750 kcmil", "800 kcmil", "900 kcmil", "1000 kcmil"
]

// Ground wire sizes for each wire size (NEC Table 250.122)
const groundSizeForWire: Record<string, string> = {
  "14 AWG": "14 AWG", "12 AWG": "12 AWG", "10 AWG": "10 AWG", "8 AWG": "10 AWG", "6 AWG": "10 AWG",
  "4 AWG": "10 AWG", "3 AWG": "8 AWG", "2 AWG": "8 AWG", "1 AWG": "8 AWG",
  "1/0 AWG": "6 AWG", "2/0 AWG": "6 AWG", "3/0 AWG": "6 AWG", "4/0 AWG": "4 AWG",
  "250 kcmil": "4 AWG", "300 kcmil": "4 AWG", "350 kcmil": "3 AWG", "400 kcmil": "3 AWG",
  "500 kcmil": "2 AWG", "600 kcmil": "1 AWG", "700 kcmil": "1/0 AWG", "750 kcmil": "2/0 AWG",
  "800 kcmil": "2/0 AWG", "900 kcmil": "3/0 AWG", "1000 kcmil": "3/0 AWG"
}

// Ampacity values at 75C (NEC Table 310.16)
const ampacityAt75C: Record<string, { copper: number; aluminum: number }> = {
  "14 AWG": { copper: 15, aluminum: 0 },
  "12 AWG": { copper: 20, aluminum: 15 },
  "10 AWG": { copper: 30, aluminum: 25 },
  "8 AWG": { copper: 40, aluminum: 35 },
  "6 AWG": { copper: 55, aluminum: 45 },
  "4 AWG": { copper: 70, aluminum: 60 },
  "3 AWG": { copper: 85, aluminum: 70 },
  "2 AWG": { copper: 95, aluminum: 85 },
  "1 AWG": { copper: 110, aluminum: 95 },
  "1/0 AWG": { copper: 125, aluminum: 110 },
  "2/0 AWG": { copper: 145, aluminum: 130 },
  "3/0 AWG": { copper: 165, aluminum: 150 },
  "4/0 AWG": { copper: 195, aluminum: 180 },
  "250 kcmil": { copper: 215, aluminum: 200 },
  "300 kcmil": { copper: 240, aluminum: 225 },
  "350 kcmil": { copper: 260, aluminum: 250 },
  "400 kcmil": { copper: 280, aluminum: 270 },
  "500 kcmil": { copper: 320, aluminum: 310 },
  "600 kcmil": { copper: 355, aluminum: 340 },
  "700 kcmil": { copper: 385, aluminum: 375 },
  "750 kcmil": { copper: 400, aluminum: 385 },
  "800 kcmil": { copper: 410, aluminum: 395 },
  "900 kcmil": { copper: 435, aluminum: 425 },
  "1000 kcmil": { copper: 455, aluminum: 445 },
}

// Feeder schedule based on provided data
const feederSchedule: Record<number, FeederConfig> = {
  20: {
    copper: { wireSize: "12 AWG", groundSize: "12 AWG", conduitSize: '3/4"' },
    aluminum: { wireSize: "10 AWG", groundSize: "10 AWG", conduitSize: '3/4"' },
  },
  30: {
    copper: { wireSize: "10 AWG", groundSize: "10 AWG", conduitSize: '3/4"' },
    aluminum: { wireSize: "8 AWG", groundSize: "10 AWG", conduitSize: '1"' },
  },
  40: {
    copper: { wireSize: "8 AWG", groundSize: "10 AWG", conduitSize: '1"' },
    aluminum: { wireSize: "6 AWG", groundSize: "10 AWG", conduitSize: '1"' },
  },
  50: {
    copper: { wireSize: "6 AWG", groundSize: "10 AWG", conduitSize: '1"' },
    aluminum: { wireSize: "4 AWG", groundSize: "10 AWG", conduitSize: '1-1/4"' },
  },
  60: {
    copper: { wireSize: "4 AWG", groundSize: "10 AWG", conduitSize: '1-1/4"' },
    aluminum: { wireSize: "3 AWG", groundSize: "8 AWG", conduitSize: '1-1/4"' },
  },
  70: {
    copper: { wireSize: "4 AWG", groundSize: "8 AWG", conduitSize: '1-1/4"' },
    aluminum: { wireSize: "2 AWG", groundSize: "8 AWG", conduitSize: '1-1/4"' },
  },
  80: {
    copper: { wireSize: "3 AWG", groundSize: "8 AWG", conduitSize: '1-1/4"' },
    aluminum: { wireSize: "1 AWG", groundSize: "8 AWG", conduitSize: '1-1/2"' },
  },
  90: {
    copper: { wireSize: "2 AWG", groundSize: "8 AWG", conduitSize: '1-1/4"' },
    aluminum: { wireSize: "1/0 AWG", groundSize: "6 AWG", conduitSize: '2"' },
  },
  100: {
    copper: { wireSize: "1 AWG", groundSize: "8 AWG", conduitSize: '1-1/2"' },
    aluminum: { wireSize: "2/0 AWG", groundSize: "6 AWG", conduitSize: '2"' },
  },
  125: {
    copper: { wireSize: "1/0 AWG", groundSize: "6 AWG", conduitSize: '2"' },
    aluminum: { wireSize: "3/0 AWG", groundSize: "4 AWG", conduitSize: '2"' },
  },
  150: {
    copper: { wireSize: "2/0 AWG", groundSize: "6 AWG", conduitSize: '2"' },
    aluminum: { wireSize: "4/0 AWG", groundSize: "4 AWG", conduitSize: '2-1/2"' },
  },
  175: {
    copper: { wireSize: "3/0 AWG", groundSize: "6 AWG", conduitSize: '2"' },
    aluminum: { wireSize: "250 kcmil", groundSize: "4 AWG", conduitSize: '2-1/2"' },
  },
  200: {
    copper: { wireSize: "4/0 AWG", groundSize: "4 AWG", conduitSize: '2-1/2"' },
    aluminum: { wireSize: "300 kcmil", groundSize: "2 AWG", conduitSize: '2-1/2"' },
  },
  225: {
    copper: { wireSize: "250 kcmil", groundSize: "4 AWG", conduitSize: '2-1/2"' },
    aluminum: { wireSize: "350 kcmil", groundSize: "2 AWG", conduitSize: '3"' },
  },
  250: {
    copper: { wireSize: "300 kcmil", groundSize: "4 AWG", conduitSize: '2-1/2"' },
    aluminum: { wireSize: "400 kcmil", groundSize: "1 AWG", conduitSize: '3"' },
  },
  300: {
    copper: { wireSize: "350 kcmil", groundSize: "3 AWG", conduitSize: '3"' },
    aluminum: { wireSize: "500 kcmil", groundSize: "1 AWG", conduitSize: '3-1/2"' },
  },
  350: {
    copper: { wireSize: "500 kcmil", groundSize: "2 AWG", conduitSize: '3"' },
    aluminum: { wireSize: "600 kcmil", groundSize: "1/0 AWG", conduitSize: '3-1/2"' },
  },
  400: {
    copper: { wireSize: "600 kcmil", groundSize: "1 AWG", conduitSize: '3-1/2"' },
    aluminum: { wireSize: "750 kcmil", groundSize: "2/0 AWG", conduitSize: '4"' },
  },
  450: {
    copper: { wireSize: "250 kcmil", groundSize: "1 AWG", conduitSize: '2-1/2"', sets: 2 },
    aluminum: { wireSize: "300 kcmil", groundSize: "2/0 AWG", conduitSize: '3"', sets: 2 },
  },
  500: {
    copper: { wireSize: "300 kcmil", groundSize: "1/0 AWG", conduitSize: '3"', sets: 2 },
    aluminum: { wireSize: "350 kcmil", groundSize: "3/0 AWG", conduitSize: '3"', sets: 2 },
  },
  600: {
    copper: { wireSize: "350 kcmil", groundSize: "2/0 AWG", conduitSize: '3"', sets: 2 },
    aluminum: { wireSize: "500 kcmil", groundSize: "4/0 AWG", conduitSize: '3-1/2"', sets: 2 },
  },
  700: {
    copper: { wireSize: "400 kcmil", groundSize: "3/0 AWG", conduitSize: '3"', sets: 2 },
    aluminum: { wireSize: "600 kcmil", groundSize: "250 kcmil", conduitSize: '4"', sets: 2 },
  },
  800: {
    copper: { wireSize: "500 kcmil", groundSize: "4/0 AWG", conduitSize: '3-1/2"', sets: 2 },
    aluminum: { wireSize: "350 kcmil", groundSize: "250 kcmil", conduitSize: '3"', sets: 3 },
  },
  1000: {
    copper: { wireSize: "350 kcmil", groundSize: "250 kcmil", conduitSize: '3"', sets: 3 },
    aluminum: { wireSize: "500 kcmil", groundSize: "350 kcmil", conduitSize: '3-1/2"', sets: 3 },
  },
  1200: {
    copper: { wireSize: "400 kcmil", groundSize: "300 kcmil", conduitSize: '3-1/2"', sets: 3 },
    aluminum: { wireSize: "600 kcmil", groundSize: "400 kcmil", conduitSize: '4"', sets: 3 },
  },
  1600: {
    copper: { wireSize: "600 kcmil", groundSize: "350 kcmil", conduitSize: '4"', sets: 4 },
    aluminum: { wireSize: "500 kcmil", groundSize: "500 kcmil", conduitSize: '4"', sets: 5 },
  },
  2000: {
    copper: { wireSize: "500 kcmil", groundSize: "500 kcmil", conduitSize: '4"', sets: 5 },
    aluminum: { wireSize: "600 kcmil", groundSize: "600 kcmil", conduitSize: '4"', sets: 6 },
  },
}

// Function to get the closest amperage from the feeder schedule
function getClosestAmperage(amperage: number): number {
  const amperages = Object.keys(feederSchedule)
    .map(Number)
    .sort((a, b) => a - b)

  for (let i = 0; i < amperages.length; i++) {
    if (amperage <= amperages[i]) {
      return amperages[i]
    }
  }
  return amperages[amperages.length - 1]
}

// Simplified conduit size calculation
export function calculateConduitSize(wireSize: string, conduitType: string, conductorCount: number): string {
  // This is a simplified version that returns the conduit size based on the feeder schedule
  // In a real implementation, this would use the NEC tables to calculate the exact size

  // Default sizes based on common configurations
  const defaultSizes: Record<string, string> = {
    "12 AWG": '3/4"',
    "10 AWG": '3/4"',
    "8 AWG": '1"',
    "6 AWG": '1"',
    "4 AWG": '1-1/4"',
    "3 AWG": '1-1/4"',
    "2 AWG": '1-1/4"',
    "1 AWG": '1-1/2"',
    "1/0 AWG": '2"',
    "2/0 AWG": '2"',
    "3/0 AWG": '2"',
    "4/0 AWG": '2-1/2"',
    "250 kcmil": '2-1/2"',
    "300 kcmil": '3"',
    "350 kcmil": '3"',
    "400 kcmil": '3"',
    "500 kcmil": '3-1/2"',
    "600 kcmil": '3-1/2"',
    "700 kcmil": '4"',
    "750 kcmil": '4"',
    "800 kcmil": '4"',
    "900 kcmil": '4"',
    "1000 kcmil": '4"',
  }

  // Adjust for conductor count
  if (conductorCount > 3) {
    // Increase conduit size for more conductors
    const sizes = ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '3-1/2"', '4"']
    const currentSizeIndex = sizes.indexOf(defaultSizes[wireSize])
    if (currentSizeIndex >= 0 && currentSizeIndex < sizes.length - 1) {
      // Increase by one size for 4-6 conductors, two sizes for more
      const sizeIncrease = conductorCount <= 6 ? 1 : 2
      return sizes[Math.min(currentSizeIndex + sizeIncrease, sizes.length - 1)]
    }
  }

  return defaultSizes[wireSize] || '1"' // Default to 1" if size not found
}

// Calculate voltage drop
function calculateVoltageDrop(
  amperage: number,
  wireSize: string,
  length: number,
  voltage: number,
  phase: string,
  conductorType: string,
): number {
  // Resistance values (ohms per 1000 feet) for copper and aluminum conductors
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

  // Get resistance value
  const resistance = resistanceValues[wireSize]?.[conductorType] || 0.1

  // Calculate voltage drop
  const multiplier = phase === "three" ? Math.sqrt(3) : 2
  const voltageDrop = (multiplier * resistance * amperage * length) / 1000

  return voltageDrop
}

// Find optimal wire size for given run length and voltage drop constraint
export function findOptimalWireSize(
  amperage: number,
  runLength: number,
  voltage: number,
  phase: string,
  conductorType: "copper" | "aluminum",
  maxVoltageDropPercent: number,
): { wireSize: string; groundSize: string; conduitSize: string; sets: number; voltageDropPercent: number } | null {
  const maxAllowedVoltageDrop = (voltage * maxVoltageDropPercent) / 100
  
  console.log("[v0] findOptimalWireSize called:", { amperage, runLength, voltage, phase, conductorType, maxVoltageDropPercent, maxAllowedVoltageDrop })
  
  // Resistance values (ohms per 1000 feet)
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
  
  const multiplier = phase === "three" ? Math.sqrt(3) : 2
  
  // Try different number of parallel sets (1 to 6)
  for (let sets = 1; sets <= 6; sets++) {
    const currentPerSet = amperage / sets
    
    // Iterate through wire sizes from smallest to largest
    for (const wireSize of wireSizesOrdered) {
      const ampacity = ampacityAt75C[wireSize]?.[conductorType] || 0
      
      // Skip if wire can't handle the current per set
      if (ampacity < currentPerSet) continue
      
      // Calculate voltage drop for this wire size and sets
      const resistance = resistanceValues[wireSize]?.[conductorType]
      if (!resistance) continue
      
      // For parallel sets, current is divided but voltage drop calculation stays same per set
      const voltageDrop = (multiplier * resistance * currentPerSet * runLength) / 1000
      const voltageDropPercent = (voltageDrop / voltage) * 100
      
      // If voltage drop is within limit, we found our wire
      if (voltageDrop <= maxAllowedVoltageDrop) {
        console.log("[v0] Found optimal wire:", { wireSize, sets, voltageDrop, voltageDropPercent })
        return {
          wireSize,
          groundSize: groundSizeForWire[wireSize] || "10 AWG",
          conduitSize: calculateConduitSize(wireSize, "emt", phase === "three" ? 4 : 3),
          sets,
          voltageDropPercent: Math.round(voltageDropPercent * 100) / 100,
        }
      }
    }
  }
  
  // If we couldn't find a solution with up to 6 sets, return null
  console.log("[v0] Could not find optimal wire within constraints")
  return null
}

// Calculate maximum length based on voltage drop
function calculateMaxLength(
  amperage: number,
  wireSize: string,
  voltage: number,
  phase: string,
  conductorType: string,
  maxVoltageDropPercent: number,
): number {
  const maxVoltageDrop = (voltage * maxVoltageDropPercent) / 100
  const multiplier = phase === "three" ? Math.sqrt(3) : 2

  // Resistance values (ohms per 1000 feet)
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

  // Get resistance value
  const resistance = resistanceValues[wireSize]?.[conductorType] || 0.1

  // Calculate maximum length
  const maxLength = (maxVoltageDrop * 1000) / (multiplier * resistance * amperage)

  return Math.floor(maxLength)
}

// Main function to calculate parallel feeders
export function calculateParallelFeeders(
  amperage: number,
  conductorType: string,
  temperature: string,
  phase: string,
  includeNeutral: boolean,
  conduitType: string,
  voltage: number,
  useNextSizeUp = false,
  voltageDropPercent = 3,
  runLength: number | null = null,
): any {
  // Get the closest amperage from the feeder schedule
  const closestAmperage = getClosestAmperage(amperage)

  // Get the next size up if requested
  const targetAmperage = useNextSizeUp
    ? Object.keys(feederSchedule)
        .map(Number)
        .sort((a, b) => a - b)
        .find((a) => a > closestAmperage) || closestAmperage
    : closestAmperage

  // Get the feeder configuration
  const feederConfig = feederSchedule[targetAmperage]

  if (!feederConfig) {
    return {
      wireSize: "Not found",
      groundWireSize: "Not found",
      conduitSize: "Not found",
      sets: 1,
      wiresPerSet: phase === "three" ? 3 : 2,
      maxAmpacity: 0,
      maxLength: 0,
      voltageAtLoad: voltage,
      voltageDrop: 0,
      voltageDropPercent: 0,
      isOptimal: false,
    }
  }

  // Calculate the number of wires per set
  const wiresPerSet = phase === "three" ? 3 : phase === "single" && voltage === 120 ? 1 : 2

  // Calculate the total number of conductors including neutral if needed
  const totalConductors = includeNeutral ? wiresPerSet + 1 : wiresPerSet

  // If run length is provided, find optimal wire size that meets voltage drop requirement
  if (runLength && runLength > 0) {
    console.log("[v0] Run length provided, finding optimal wire size:", { runLength, voltageDropPercent })
    const optimalConfig = findOptimalWireSize(
      amperage,
      runLength,
      voltage,
      phase,
      conductorType as "copper" | "aluminum",
      voltageDropPercent,
    )

    if (optimalConfig) {
      console.log("[v0] Optimal config found:", optimalConfig)
      // Calculate actual voltage drop for the optimal wire
      const voltageDrop = calculateVoltageDrop(
        amperage / optimalConfig.sets,
        optimalConfig.wireSize,
        runLength,
        voltage,
        phase,
        conductorType,
      )
      const voltageAtLoad = voltage - voltageDrop
      
      // Get ampacity for this wire size
      const ampacity = ampacityAt75C[optimalConfig.wireSize]?.[conductorType as "copper" | "aluminum"] || 0

      return {
        wireSize: optimalConfig.wireSize,
        groundWireSize: optimalConfig.groundSize,
        conduitSize: optimalConfig.conduitSize,
        sets: optimalConfig.sets,
        wiresPerSet: totalConductors,
        maxAmpacity: Math.round(ampacity),
        maxLength: 0, // Not applicable when run length is specified
        voltageAtLoad: Math.round(voltageAtLoad * 10) / 10,
        voltageDrop: Math.round(voltageDrop * 10) / 10,
        voltageDropPercent: optimalConfig.voltageDropPercent,
        isOptimal: true,
      }
    } else {
      // Could not find a wire that meets the voltage drop requirement
      // Fall back to the schedule config but mark as not optimal
      const config = feederConfig[conductorType as keyof typeof feederConfig]
      const voltageDrop = calculateVoltageDrop(
        amperage / (config.sets || 1),
        config.wireSize,
        runLength,
        voltage,
        phase,
        conductorType,
      )
      const voltageAtLoad = voltage - voltageDrop
      const voltageDropPercentActual = (voltageDrop / voltage) * 100

      return {
        wireSize: config.wireSize,
        groundWireSize: config.groundSize,
        conduitSize: config.conduitSize,
        sets: config.sets || 1,
        wiresPerSet: totalConductors,
        maxAmpacity: Math.round(targetAmperage / (config.sets || 1)),
        maxLength: 0,
        voltageAtLoad: Math.round(voltageAtLoad * 10) / 10,
        voltageDrop: Math.round(voltageDrop * 10) / 10,
        voltageDropPercent: Math.round(voltageDropPercentActual * 100) / 100,
        isOptimal: false,
        exceedsLimit: voltageDropPercentActual > voltageDropPercent,
      }
    }
  }

  // No run length - show max length for the schedule wire size
  const config = feederConfig[conductorType as keyof typeof feederConfig]
  const maxLength = calculateMaxLength(
    amperage / (config.sets || 1),
    config.wireSize,
    voltage,
    phase,
    conductorType,
    voltageDropPercent,
  )

  // Return the results
  return {
    wireSize: config.wireSize,
    groundWireSize: config.groundSize,
    conduitSize: config.conduitSize,
    sets: config.sets || 1,
    wiresPerSet: totalConductors,
    maxAmpacity: Math.round(targetAmperage / (config.sets || 1)),
    maxLength: maxLength,
    voltageAtLoad: voltage,
    voltageDrop: 0,
    voltageDropPercent: 0,
    isOptimal: false,
  }
}
