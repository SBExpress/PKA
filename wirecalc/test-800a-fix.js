// Quick test to verify the findOptimalConfiguration algorithm
// This tests the logic without needing to run the full app

// Simulated NEC table ampacities @ 75°C
const ampacities = {
  "14 AWG": { copper: 20, aluminum: 0 },
  "12 AWG": { copper: 25, aluminum: 20 },
  "10 AWG": { copper: 35, aluminum: 30 },
  "250 kcmil": { copper: 255, aluminum: 205 },
  "300 kcmil": { copper: 285, aluminum: 230 },
  "350 kcmil": { copper: 310, aluminum: 250 },
  "400 kcmil": { copper: 335, aluminum: 270 },
  "500 kcmil": { copper: 380, aluminum: 310 },
  "600 kcmil": { copper: 420, aluminum: 340 },
  "700 kcmil": { copper: 460, aluminum: 375 },
  "750 kcmil": { copper: 475, aluminum: 385 },
};

const wireSizes = ["14 AWG", "12 AWG", "10 AWG", "250 kcmil", "300 kcmil", "350 kcmil", "400 kcmil", "500 kcmil", "600 kcmil", "700 kcmil", "750 kcmil"];

// Algorithm from findOptimalConfiguration
function findOptimal(requiredAmpacity, conductorType, adjustmentFactor) {
  const validConfigs = [];

  // Try 1 to 6 sets
  for (let sets = 1; sets <= 6; sets++) {
    // For each wire size
    for (const wireSize of wireSizes) {
      const baseAmpacity = ampacities[wireSize]?.[conductorType] || 0;
      const adjustedAmpacity = baseAmpacity * adjustmentFactor;
      const totalAmpacity = adjustedAmpacity * sets;

      // If this config meets requirement, add it
      if (totalAmpacity >= requiredAmpacity) {
        validConfigs.push({ wireSize, sets, totalAmpacity });
      }
    }
  }

  if (validConfigs.length === 0) return null;

  // Sort by totalAmpacity (ascending) - pick smallest
  validConfigs.sort((a, b) => a.totalAmpacity - b.totalAmpacity);

  return validConfigs[0];
}

// TEST CASE 1: 800A, Aluminum, 3-phase (adjustmentFactor = 1.0)
console.log("TEST 1: 800A Aluminum 3-phase");
const result1 = findOptimal(800, "aluminum", 1.0);
console.log(`  Result: ${result1.sets}-sets × ${result1.wireSize} = ${result1.totalAmpacity}A`);
console.log(`  Expected: 3-sets × 400 kcmil = 810A`);
console.log(`  PASS: ${result1.wireSize === "400 kcmil" && result1.sets === 3 && result1.totalAmpacity === 810 ? "✓" : "✗"}`);

// TEST CASE 2: 650A, Aluminum, 3-phase
console.log("\nTEST 2: 650A Aluminum 3-phase");
const result2 = findOptimal(650, "aluminum", 1.0);
console.log(`  Result: ${result2.sets}-sets × ${result2.wireSize} = ${result2.totalAmpacity}A`);
console.log(`  Expected: 2-sets × 350 kcmil = 500A or 3-sets of smaller wire`);
console.log(`  Details: Best fit should be minimal oversizing`);

// TEST CASE 3: 1000A, Aluminum, 3-phase
console.log("\nTEST 3: 1000A Aluminum 3-phase");
const result3 = findOptimal(1000, "aluminum", 1.0);
console.log(`  Result: ${result3.sets}-sets × ${result3.wireSize} = ${result3.totalAmpacity}A`);
console.log(`  Expected: 3-sets × 350 kcmil = 750A (too small) OR 3-sets × 400 kcmil = 810A`);

// TEST CASE 4: 700A, Copper, 3-phase
console.log("\nTEST 4: 700A Copper 3-phase");
const result4 = findOptimal(700, "copper", 1.0);
console.log(`  Result: ${result4.sets}-sets × ${result4.wireSize} = ${result4.totalAmpacity}A`);
console.log(`  Expected: 2-sets × 350 kcmil = 620A (too small) OR 3-sets of smaller wire`);

console.log("\n✅ Algorithm test complete");
