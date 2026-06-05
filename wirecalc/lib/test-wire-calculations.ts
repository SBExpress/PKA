/**
 * Test suite for wire-calculations-v3.ts
 * Tests the two critical fixes:
 * 1. Low amperage loads (< 2000A) should find wire via NEC lookup
 * 2. Undersized results should be automatically corrected
 */

import { calculateOptimalFeeder } from "./wire-calculations-v3"

interface TestCase {
  name: string
  amperage: number
  voltage: number
  phase: "single" | "three"
  runLength: number
  expectedSuccess: boolean
  expectedMinAmpacity?: number
  notes?: string
}

const testCases: TestCase[] = [
  // Issue #2: Low amperage loads should find wire sizes
  {
    name: "7A Load (Very Low)",
    amperage: 7,
    voltage: 120,
    phase: "single",
    runLength: 100,
    expectedSuccess: true,
    expectedMinAmpacity: 7,
    notes: "Should use NEC lookup to find 14 AWG (20A @ 75°C)"
  },
  {
    name: "20A Load (Low)",
    amperage: 20,
    voltage: 120,
    phase: "single",
    runLength: 100,
    expectedSuccess: true,
    expectedMinAmpacity: 20,
    notes: "Should use NEC lookup to find 12 AWG (25A @ 75°C)"
  },
  {
    name: "260A Load (Mid-Low)",
    amperage: 260,
    voltage: 480,
    phase: "three",
    runLength: 100,
    expectedSuccess: true,
    expectedMinAmpacity: 260,
    notes: "Should use NEC lookup, no schedule entry"
  },

  // Issue #1: Undersized results should be corrected
  {
    name: "650A Load (Previously Undersized)",
    amperage: 650,
    voltage: 480,
    phase: "three",
    runLength: 100,
    expectedSuccess: true,
    expectedMinAmpacity: 650,
    notes: "Should NOT be undersized; should auto-upgrade wire or add sets"
  },
  {
    name: "700A Load (Previously Undersized)",
    amperage: 700,
    voltage: 480,
    phase: "three",
    runLength: 100,
    expectedSuccess: true,
    expectedMinAmpacity: 700,
    notes: "Should NOT be undersized; should auto-upgrade wire or add sets"
  },

  // In-between amperage loads (should round up to next schedule)
  {
    name: "3100A Load (Between Schedule Entries)",
    amperage: 3100,
    voltage: 480,
    phase: "three",
    runLength: 100,
    expectedSuccess: true,
    expectedMinAmpacity: 3100,
    notes: "Should round up to 3500A schedule entry"
  },
  {
    name: "3200A Load (Between Schedule Entries)",
    amperage: 3200,
    voltage: 480,
    phase: "three",
    runLength: 100,
    expectedSuccess: true,
    expectedMinAmpacity: 3200,
    notes: "Should round up to 3500A schedule entry"
  },

  // Standard feeder loads (should work as before)
  {
    name: "2000A Load (Min Schedule)",
    amperage: 2000,
    voltage: 480,
    phase: "three",
    runLength: 100,
    expectedSuccess: true,
    expectedMinAmpacity: 2000,
  },
  {
    name: "3000A Load (Standard)",
    amperage: 3000,
    voltage: 480,
    phase: "three",
    runLength: 100,
    expectedSuccess: true,
    expectedMinAmpacity: 3000,
  },
]

// Run tests
console.log("WIRECALC TEST SUITE - Fix Verification\n")
console.log("=" .repeat(80))

let passed = 0
let failed = 0

for (const testCase of testCases) {
  console.log(`\nTest: ${testCase.name}`)
  console.log(`Input: ${testCase.amperage}A @ ${testCase.voltage}V (${testCase.phase}-phase)`)
  console.log(`Run Length: ${testCase.runLength} ft`)
  if (testCase.notes) console.log(`Notes: ${testCase.notes}`)

  try {
    const result = calculateOptimalFeeder({
      amperage: testCase.amperage,
      voltage: testCase.voltage,
      phase: testCase.phase,
      runLength: testCase.runLength,
      conductorType: "copper",
      tempRating: "75",
      maxVoltageDropPercent: 3,
      manualOverride: false,
      manualWireSize: undefined,
      maxCopperWireSize: "600 kcmil",
      maxAluminumWireSize: "750 kcmil",
    })

    const hasWire = result.wireSize !== "—"
    const meetsAmpacity = result.maxAmpacity >= testCase.expectedMinAmpacity!
    const notUndersized = !result.isFailed
    const success = hasWire && meetsAmpacity && (testCase.expectedSuccess ? notUndersized : true)

    if (success) {
      console.log(`✓ PASS`)
      console.log(`  Wire: ${result.wireSize} × ${result.sets} sets`)
      console.log(`  Ampacity: ${result.maxAmpacity}A (need: ${testCase.expectedMinAmpacity}A)`)
      console.log(`  Status: ${result.isFailed ? "FAILED (PROBLEM!)" : "OK"}`)
      passed++
    } else {
      console.log(`✗ FAIL`)
      console.log(`  Wire: ${result.wireSize} × ${result.sets} sets`)
      console.log(`  Ampacity: ${result.maxAmpacity}A (need: ${testCase.expectedMinAmpacity}A)`)
      console.log(`  Status: ${result.isFailed ? "FAILED" : "OK"}`)
      if (!hasWire) console.log(`  Issue: No wire found`)
      if (!meetsAmpacity) console.log(`  Issue: Ampacity (${result.maxAmpacity}A) < Required (${testCase.expectedMinAmpacity}A)`)
      if (result.isFailed) console.log(`  Issue: Result marked as FAILED`)
      failed++
    }
  } catch (error) {
    console.log(`✗ ERROR: ${error instanceof Error ? error.message : String(error)}`)
    failed++
  }
}

console.log("\n" + "=".repeat(80))
console.log(`\nResults: ${passed} passed, ${failed} failed`)
console.log(`Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

if (failed === 0) {
  console.log("\n✓ All tests passed! The fixes are working correctly.")
} else {
  console.log(`\n✗ ${failed} test(s) failed. Issues need to be addressed.`)
  process.exit(1)
}
