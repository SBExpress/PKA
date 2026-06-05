# Wirecalc v3.0 - Visual Testing Guide

## 🎬 What You'll See When Testing

### **Page URL**
```
http://localhost:3000/v3
```

---

## 🎨 Visual Layout

### **HEADER SECTION**
```
╔════════════════════════════════════════════════════════════════╗
║  ⚡ Wire & Conduit Calculator                                  ║
║     v3.0 Beta — With NEC Tables & Voltage Drop Optimization  ║
╚════════════════════════════════════════════════════════════════╝
```
- Gradient from indigo to purple
- Version badge showing v3.0
- Modern, professional header

---

### **MAIN CALCULATOR CARD**
```
╔════════════════════════════════════════════════════════════════╗
║ ⚡ Feeder Calculator                    ☀️                      ║
║ Calculate wire size with voltage drop optimization            ║
╠════════════════════════════════════════════════════════════════╣
║ [Calculator] [NEC Tables] [History (0)]                       ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║ INPUT COLUMN         │ RESULTS COLUMN                         ║
║ ─────────────────────┼──────────────────────────────────────  ║
║ Load Amperage        │                                         ║
║ [−] [100] [+]        │ Copper (Preferred)                     ║
║ ±10A per click       │ ┌────────────────────────────────────┐ ║
║                      │ │ 4 AWG (1 set)                      │ ║
║ System Voltage       │ │ + 10 AWG GND in 1-1/4" Conduit     │ ║
║ [120] [208] [240]    │ │ Max Ampacity: 70A                  │ ║
║ [277] [480] [600]    │ │ Max Run Length: 500 feet @ 3% VD   │ ║
║                      │ │ Per NEC 310.16 & 310.15(B)(2)      │ ║
║ Conductor Type       │ └────────────────────────────────────┘ ║
║ [Copper] [Aluminum]  │                                         ║
║                      │ Aluminum (Alternative)                 ║
║ Phase & Temp         │ ┌────────────────────────────────────┐ ║
║ [1-Phase] [60°C]     │ │ 2 AWG (1 set)                      │ ║
║ [3-Phase] [75°C]     │ │ + 8 AWG GND in 1-1/4" Conduit      │ ║
║            [90°C]    │ │ Max Ampacity: 85A                  │ ║
║                      │ │ Max Run Length: 600 feet @ 3% VD   │ ║
║ Max Voltage Drop     │ └────────────────────────────────────┘ ║
║ [1%][2%][3%][4%][5%] │                                         ║
║                      │ [Reset] [Share] [Save]                 ║
║ Run Length (optional)│                                         ║
║ [________] feet      │                                         ║
║                      │                                         ║
║ [Calculate Feeder]   │                                         ║
║                      │                                         ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🧪 Test Scenario 1: Basic Calculation

**What to do:**
1. Keep defaults: 100A @ 208V, 3-Phase, 75°C, Copper
2. Click "Calculator" tab (if not already selected)
3. Results should auto-calculate

**What you'll see:**
- Left column: Input form with amperage showing "100"
- Right column: 
  - ✅ Copper card shows "1/0 AWG" or similar
  - ✅ Aluminum alternative shows larger wire size
  - ✅ Max ampacity values shown (e.g., "125A")
  - ✅ Max run length shows ~500-600 feet

---

## 🧪 Test Scenario 2: Temperature Derating

**What to do:**
1. Keep 100A @ 208V, 3-Phase
2. Switch to 60°C temperature rating
3. Note the wire size
4. Switch to 90°C temperature rating
5. Note the difference

**Expected results:**
- **60°C:** Wire size should be LARGER (lower ampacity available)
- **75°C:** Medium wire size (baseline)
- **90°C:** Wire size should be SMALLER (higher ampacity available)

**Example:**
- 60°C: 2 AWG (lower ampacity)
- 75°C: 1/0 AWG (standard)
- 90°C: 2/0 AWG (higher ampacity allows smaller wire)

---

## 🧪 Test Scenario 3: Run Length Optimization

**What to do:**
1. 100A @ 208V, 3-Phase
2. Enter run length: 500 feet
3. Max voltage drop: 3%
4. Observe results

**What you'll see:**
- ✅ "Optimal Configuration" banner appears (green)
- ✅ Shows voltage drop percentage (e.g., "2.8%")
- ✅ Shows voltage at load (e.g., "206.2V")
- ✅ Wire size adjusted to meet voltage drop constraint
- ✅ May show multiple sets if needed (e.g., "2-sets of #2 AWG")

**Try different run lengths:**
- 100 feet → Smaller wire, lower voltage drop
- 1000 feet → Larger wire needed to stay under 3% VD

---

## 🧪 Test Scenario 4: NEC Reference Tables

**What to do:**
1. Click "NEC Tables" tab
2. Click "310.16" tab within it
3. Scroll through ampacity table

**What you'll see:**
- Table with columns:
  ```
  Wire Size | Cu 60°C | Cu 75°C | Cu 90°C | Al 60°C | Al 75°C | Al 90°C
  ───────────────────────────────────────────────────────────────────────
  14 AWG   │   15   │   15   │   20   │  —  │  —  │  —
  12 AWG   │   20   │   20   │   25   │  15  │  15  │  20
  ...continues...
  ```
- ✅ All values match NEC 310.16 (2023)
- ✅ Aluminum values show "—" for small sizes (illegal)
- ✅ Higher temps show higher ampacity

**Try other tabs:**
- **Quick Ref:** Shows 20A to 200A common sizes
- **250.122:** Shows grounding wire requirements
- **Annex C:** Shows conduit fill by size
- **Adjustment:** Shows derating factors explanation

---

## 🧪 Test Scenario 5: Include Neutral

**What to do:**
1. 100A @ 208V (not 120V)
2. Check "Include Neutral" switch
3. Observe results

**What changes:**
- ✅ Results should show 4 conductors instead of 3
- ✅ Conduit size might increase
- ✅ Ampacity reduced by derating factor (0.8 for 4 conductors)
- ✅ Max run length might decrease

---

## 🧪 Test Scenario 6: Conductor Type Derating

**What to do:**
1. 60A @ 240V, 3-Phase
2. Select Copper → note wire size
3. Switch to Aluminum → note wire size

**Expected:**
- Copper: Smaller (higher ampacity)
- Aluminum: Larger (lower ampacity per NEC)

Example:
- Copper: 4 AWG @ 70A
- Aluminum: 2 AWG @ 85A (but only 60A used)

---

## 🧪 Test Scenario 7: Voltage Drop Variations

**What to do:**
1. 100A @ 208V, 500ft run, 3-Phase
2. Change max voltage drop: 1% → 2% → 3% → 5%
3. Watch wire sizes change

**Expected:**
- **1% VD:** Largest wire (strictest)
- **3% VD:** Medium wire (standard)
- **5% VD:** Smaller wire (most relaxed)

Wire sizes should go: smaller → medium → larger as you increase max %

---

## 🧪 Test Scenario 8: Error Handling

**What to do:**
1. Clear amperage, enter "0"
2. Observe error message

**Expected:**
- ✅ Red alert appears: "Amperage must be between 1A and 4000A"

**Try other errors:**
- Amperage 5000 → Error
- Run length 15000 → Error
- Results show error card: "No Solution Found"

---

## 🎨 Visual Design Check

**Look for:**

✅ **Color Scheme**
- Indigo/purple gradient header
- Indigo buttons for primary actions
- Green for optimal/success states
- Red for errors/warnings
- Dark mode toggle works (sun/moon icon)

✅ **Layout**
- Desktop: 3 columns (Form | Results | sidebar)
- Tablet: 2-3 rows adapting
- Mobile: Single column, stacked
- Cards have proper spacing

✅ **Typography**
- Title: Large, bold, gradient
- Headings: Clear hierarchy
- Labels: Readable, properly spaced
- Values: Prominent, easy to read

✅ **Responsiveness**
- Resize window → Layout adapts
- No horizontal scrolling on mobile
- All buttons accessible
- Text readable at all sizes

---

## ✅ Success Criteria Checklist

When testing, verify:

### Core Functionality
- [ ] Inputs update results in real-time (with 300ms debounce)
- [ ] Temperature rating affects ampacity correctly
- [ ] Run length enables voltage drop optimization
- [ ] Results show both copper and aluminum options
- [ ] Error messages appear for invalid inputs

### NEC Tables
- [ ] Quick Reference shows common sizes
- [ ] Table 310.16 displays all wire sizes with correct ampacities
- [ ] Table 250.122 shows grounding wires
- [ ] Annex C shows conduit fill percentages
- [ ] Adjustment Factors tab explains derating

### UI/UX
- [ ] Dark/light theme toggle works
- [ ] All tabs clickable and functional
- [ ] No console errors (check dev tools)
- [ ] Responsive on different screen sizes
- [ ] Buttons have hover effects
- [ ] Results cards properly formatted

### Calculations
- [ ] 100A @ 208V, 3-Phase, 75°C = 1/0 AWG ✓
- [ ] Same with 60°C = larger wire ✓
- [ ] Same with 90°C = smaller wire ✓
- [ ] With 500ft run, 3% VD = shows voltage drop ✓
- [ ] History saves/loads calculations ✓

### Performance
- [ ] Page loads quickly
- [ ] Inputs respond smoothly
- [ ] No lag when switching tabs
- [ ] Dark mode transitions smoothly
- [ ] Print functionality works

---

## 🐛 Known Issues to Ignore (For Now)

- PDF export styled but may need tweaking
- Some NEC table text might wrap on very small screens
- Ambient temperature adjustment not yet in Settings

---

## 📱 Responsive Design Test

**Desktop (1200px+)**
```
[Form] [Results]
[Form] [Results]
```

**Tablet (768-1199px)**
```
[Form] [Results]
(3-col grid → 2-col)
```

**Mobile (<768px)**
```
[Form]
[Results - if present]
(Tabs handle reference)
```

---

## 🎯 Expected v3.0 vs v2.0 Differences

| Feature | v2.0 | v3.0 |
|---------|------|------|
| Temperature | Hardcoded 75°C | 60/75/90°C selectable |
| Voltage drop bug | ❌ Has bug | ✅ Fixed |
| Component size | 1,711 lines | Modular/clean |
| NEC Tables | Basic | 5 comprehensive tabs |
| Derating | None | Full NEC 310.15 support |
| Color scheme | Blue | Indigo/Purple |
| Layout | 2-column | Responsive 3-column |
| Input validation | None | Complete |

---

## 🚀 Ready to Test!

**Start the dev server:**
```bash
npm run dev
```

**Visit:**
```
http://localhost:3000/v3
```

**Original v2.0 still available at:**
```
http://localhost:3000
```

---

**Have fun testing! 🎉**
