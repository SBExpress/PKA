// Comprehensive test of all amperage scenarios
// This simulates various loads to identify undersizing or configuration issues

// NEC Ampacity values from Table 310.16 @ 75°C
const ampacities = {
  "14 AWG": { copper: 20, aluminum: 0 },
  "12 AWG": { copper: 25, aluminum: 20 },
  "10 AWG": { copper: 35, aluminum: 30 },
  "8 AWG": { copper: 50, aluminum: 40 },
  "6 AWG": { copper: 65, aluminum: 50 },
  "4 AWG": { copper: 85, aluminum: 65 },
  "3 AWG": { copper: 100, aluminum: 75 },
  "2 AWG": { copper: 115, aluminum: 90 },
  "1 AWG": { copper: 130, aluminum: 100 },
  "1/0 AWG": { copper: 150, aluminum: 120 },
  "2/0 AWG": { copper: 175, aluminum: 135 },
  "3/0 AWG": { copper: 200, aluminum: 155 },
  "4/0 AWG": { copper: 230, aluminum: 180 },
  "250 kcmil": { copper: 255, aluminum: 205 },
  "300 kcmil": { copper: 285, aluminum: 230 },
  "350 kcmil": { copper: 310, aluminum: 250 },
  "400 kcmil": { copper: 335, aluminum: 270 },
  "500 kcmil": { copper: 380, aluminum: 310 },
  "600 kcmil": { copper: 420, aluminum: 340 },
  "700 kcmil": { copper: 460, aluminum: 375 },
  "750 kcmil": { copper: 475, aluminum: 385 },
};

// Feeder schedule entries
const feederSchedule = {
  2000: { copper: { size: "600 kcmil", sets: 5 }, aluminum: { size: "600 kcmil", sets: 6 } },
  2500: { copper: { size: "600 kcmil", sets: 6 }, aluminum: { size: "700 kcmil", sets: 7 } },
  3000: { copper: { size: "500 kcmil", sets: 8 }, aluminum: { size: "700 kcmil", sets: 8 } },
  3500: { copper: { size: "600 kcmil", sets: 9 }, aluminum: { size: "700 kcmil", sets: 10 } },
  4000: { copper: { size: "600 kcmil", sets: 10 }, aluminum: { size: "700 kcmil", sets: 11 } },
};

console.log("Testing critical amperage scenarios...\n");

const testAmperes = [
  50, 100, 150, 200, 260, 300, 400, 500, 600, 800, 1000,
  1200, 1500, 1600, 1800, 2000, 2100, 2300, 2500, 2600, 2800, 3000,
  3100, 3200, 3300, 3400, 3500, 3600, 3800, 4000, 4200
];

const issues = [];

testAmperes.forEach(amperage => {
  // Find appropriate schedule entry (round up)
  let scheduleAmperage = null;
  const scheduleAmps = Object.keys(feederSchedule).map(Number).sort((a, b) => a - b);
  
  for (const sched of scheduleAmps) {
    if (amperage <= sched) {
      scheduleAmperage = sched;
      break;
    }
  }

  if (!scheduleAmperage) {
    issues.push(`❌ ${amperage}A: NO SCHEDULE ENTRY FOUND (exceeds max 4000A)`);
  } else {
    const schedule = feederSchedule[scheduleAmperage];
    
    // Test copper
    const cuConfig = schedule.copper;
    const cuAmpacity = ampacities[cuConfig.size].copper * cuConfig.sets;
    const cuMargin = cuAmpacity - amperage;
    const cuStatus = cuAmpacity >= amperage ? "✓" : "✗";
    
    // Test aluminum
    const alConfig = schedule.aluminum;
    const alAmpacity = ampacities[alConfig.size].aluminum * alConfig.sets;
    const alMargin = alAmpacity - amperage;
    const alStatus = alAmpacity >= amperage ? "✓" : "✗";
    
    if (cuAmpacity < amperage || alAmpacity < amperage) {
      issues.push(`❌ ${amperage}A (→${scheduleAmperage}): Cu ${cuStatus} (${cuAmpacity}A, ${cuMargin > 0 ? '+' : ''}${cuMargin}A) | Al ${alStatus} (${alAmpacity}A, ${alMargin > 0 ? '+' : ''}${alMargin}A)`);
    } else {
      console.log(`✓ ${amperage}A (→${scheduleAmperage}): Cu ${cuStatus} (${cuAmpacity}A, +${cuMargin}A) | Al ${alStatus} (${alAmpacity}A, +${alMargin}A)`);
    }
  }
});

if (issues.length > 0) {
  console.log("\n⚠️  ISSUES FOUND:\n");
  issues.forEach(issue => console.log(issue));
} else {
  console.log("\n✅ ALL TESTS PASSED!");
}
