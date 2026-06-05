// Test 3000A feeder schedule calculation

// Ampacity values from NEC Table 310.15 @ 75°C
const ampacities = {
  "500 kcmil": { copper: 380, aluminum: 360 },
  "600 kcmil": { copper: 420, aluminum: 385 },
  "700 kcmil": { copper: 385, aluminum: 360 }, // kcmil aluminum
  "750 kcmil": { copper: 385, aluminum: 385 }
};

// Test data from reference chart
const tests = [
  {
    amperage: 2000,
    copper: { size: "600 kcmil", sets: 5 },
    aluminum: { size: "600 kcmil", sets: 6 }
  },
  {
    amperage: 2500,
    copper: { size: "600 kcmil", sets: 6 },
    aluminum: { size: "700 kcmil", sets: 7 }
  },
  {
    amperage: 3000,
    copper: { size: "500 kcmil", sets: 8 },
    aluminum: { size: "700 kcmil", sets: 8 }
  },
  {
    amperage: 3500,
    copper: { size: "600 kcmil", sets: 9 },
    aluminum: { size: "700 kcmil", sets: 10 }
  },
  {
    amperage: 4000,
    copper: { size: "600 kcmil", sets: 10 },
    aluminum: { size: "700 kcmil", sets: 11 }
  }
];

console.log("Feeder Schedule Ampacity Verification\n");
console.log("Load | Cu Size    | Sets | Cu Ampacity | Cu Margin | Al Size    | Sets | Al Ampacity | Al Margin | Status");
console.log("-----|------------|------|-------------|-----------|------------|------|-------------|-----------|--------");

tests.forEach(test => {
  const cuAmpacity = ampacities[test.copper.size].copper * test.copper.sets;
  const alAmpacity = ampacities[test.aluminum.size].aluminum * test.aluminum.sets;
  
  const cuMargin = cuAmpacity - test.amperage;
  const alMargin = alAmpacity - test.amperage;
  
  const cuStatus = cuAmpacity >= test.amperage ? "✓" : "✗";
  const alStatus = alAmpacity >= test.amperage ? "✓" : "✗";
  const status = (cuAmpacity >= test.amperage && alAmpacity >= test.amperage) ? "PASS" : "FAIL";
  
  console.log(
    `${test.amperage}A | ${test.copper.size.padEnd(10)} | ${test.copper.sets}    | ${cuAmpacity}A        | ${cuMargin > 0 ? "+" : ""}${cuMargin}A       | ${test.aluminum.size.padEnd(10)} | ${test.aluminum.sets}    | ${alAmpacity}A         | ${alMargin > 0 ? "+" : ""}${alMargin}A        | ${status} ${cuStatus}${alStatus}`
  );
});
