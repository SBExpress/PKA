# Wirecalc v3.0 - Architecture & Component Structure

## 🏗️ Component Hierarchy

```
app/v3/page.tsx
  └─ <main> - Page wrapper with gradient background
      └─ WireCalculatorV3 (wire-calculator-v3.tsx) ← Main Container
          ├─ <Tabs>
          │   ├─ TabsContent "calculator"
          │   │   ├─ <CalculatorFormV3> (left column)
          │   │   │   ├─ Amperage input with ±buttons
          │   │   │   ├─ Voltage selector (6 options)
          │   │   │   ├─ Conductor type (Cu/Al)
          │   │   │   ├─ Phase selector
          │   │   │   ├─ Temperature rating (60/75/90°C)
          │   │   │   ├─ Voltage drop percentage (1-5%)
          │   │   │   ├─ Include neutral switch
          │   │   │   ├─ Run length input
          │   │   │   └─ Calculate button
          │   │   │
          │   │   └─ <ResultsDisplayV3> (right column)
          │   │       ├─ Optimal configuration banner (if run length)
          │   │       ├─ Preferred conductor card
          │   │       │   ├─ Configuration details
          │   │       │   ├─ Voltage drop info
          │   │       │   └─ Max run length
          │   │       ├─ Alternative conductor card
          │   │       └─ Action buttons (Reset, Share, Save)
          │   │
          │   ├─ TabsContent "reference"
          │   │   └─ <ReferenceTabsV3> (NEC Tables)
          │   │       ├─ TabsTrigger "quick" → Quick reference table
          │   │       ├─ TabsTrigger "310-16" → Ampacities table
          │   │       ├─ TabsTrigger "250-122" → Grounding table
          │   │       ├─ TabsTrigger "annex-c" → Conduit fill table
          │   │       └─ TabsTrigger "adjustment" → Adjustment factors
          │   │
          │   └─ TabsContent "history"
          │       └─ Saved calculations list
          │
          └─ Footer (copyright & version)
```

---

## 📦 File Organization

```
CALCULATION LOGIC
├─ lib/nec-tables.ts (NEW)
│  ├─ NEC_310_16 (ampacity data - 24 rows)
│  ├─ NEC_250_122 (grounding data - 22 rows)
│  ├─ NEC_ANNEX_C_EMT (conduit fill - 10 rows)
│  ├─ NEC_310_15_B_2_ADJUSTMENT (conductor derating)
│  ├─ NEC_310_15_AMBIENT_TEMP (temperature derating)
│  └─ COMMON_FEEDER_SIZES (quick reference)
│
└─ lib/wire-calculations-v3.ts (NEW)
   ├─ getAmpacity(wireSize, type, tempRating) ← NEW: Temp support
   ├─ getAdjustmentFactor(conductorCount) ← NEW: NEC derating
   ├─ calculateVoltageDrop(...) ← IMPROVED: Fixed logic
   ├─ calculateMaxLength(...) ← IMPROVED: Uses adjusted ampacity
   ├─ findOptimalWireSize(...) ← NEW: For run length mode
   ├─ calculateOptimalFeeder(...) ← Main function (replaces old one)
   └─ validateInputs(...) ← NEW: Input validation

COMPONENTS
├─ components/wire-calculator-v3.tsx (NEW)
│  ├─ Main state management
│  ├─ Tab handling (calculator/reference/history)
│  ├─ Auto-calculate effect
│  ├─ Save/load calculations
│  ├─ Theme toggle (dark/light)
│  └─ Error display
│
├─ components/calculator-form-v3.tsx (NEW)
│  ├─ Amperage input section
│  ├─ Voltage selector
│  ├─ Conductor type buttons
│  ├─ Phase selector
│  ├─ Temperature rating selector
│  ├─ Voltage drop buttons
│  ├─ Include neutral switch
│  ├─ Run length input
│  └─ Calculate button
│
├─ components/results-display-v3.tsx (NEW)
│  ├─ Error state handling
│  ├─ Optimal configuration banner
│  ├─ Preferred conductor card
│  ├─ Alternative conductor card
│  ├─ Voltage drop display
│  └─ Max run length display
│
├─ components/reference-tabs-v3.tsx (NEW)
│  ├─ Tabs container
│  ├─ Quick reference table
│  ├─ NEC 310.16 table (ampacities)
│  ├─ NEC 250.122 table (grounding)
│  ├─ NEC Annex C table (conduit fill)
│  └─ Adjustment factors table
│
├─ components/settings-dialog.tsx (KEPT)
│  └─ Settings for ampsPerClick, defaults, etc.

PAGES
├─ app/page.tsx (ORIGINAL)
│  └─ Renders <WireCalculator /> (v2.0)
│
└─ app/v3/page.tsx (NEW)
   └─ Renders <WireCalculatorV3 /> (v3.0)
```

---

## 🔄 Data Flow

### User enters amperage
```
Input: setAmperage(100)
  ↓
useEffect triggers (300ms debounce)
  ↓
calculateOptimalFeeder() called
  ├─ validateInputs() - Check ranges
  ├─ getAmpacity() - Get base ampacity with temp rating
  ├─ getAdjustmentFactor() - Apply conductor derating
  ├─ If runLength:
  │   └─ findOptimalWireSize() - Find wire for voltage drop
  └─ Else:
      └─ Use feeder schedule
  ↓
setResults({copper, aluminum})
  ↓
<ResultsDisplayV3> re-renders with new data
```

### User selects run length
```
Input: setRunLength(500)
  ↓
useEffect triggers (includes runLength in dependencies)
  ↓
findOptimalWireSize() called
  ├─ Try sets 1-6 (parallel feeders)
  ├─ For each set:
  │   └─ For each wire size:
  │       ├─ Calculate voltage drop
  │       ├─ Check against max allowed
  │       └─ Return when found
  ↓
Results show optimal wire size
Display voltage drop and voltage at load
```

### Reference table access
```
User clicks "NEC Tables" tab
  ↓
<ReferenceTabsV3> renders
  ├─ Quick Ref: Shows COMMON_FEEDER_SIZES
  ├─ 310.16: Shows NEC_310_16 (scrollable table)
  ├─ 250.122: Shows NEC_250_122 (scrollable table)
  ├─ Annex C: Shows NEC_ANNEX_C_EMT (scrollable table)
  └─ Adjustment: Shows derating info
```

---

## 🎯 Key Functions

### `calculateOptimalFeeder()`
**Purpose:** Main calculation entry point
**Inputs:**
- `amperage`: 1-4000A
- `conductorType`: "copper" | "aluminum"
- `tempRating`: "60" | "75" | "90"
- `phase`: "single" | "three"
- `includeNeutral`: boolean
- `voltage`: 120, 208, 240, 277, 480, 600
- `maxVoltageDropPercent`: 1-5%
- `runLength`: null or 0-10000 feet

**Outputs:**
```typescript
{
  wireSize: "4 AWG",
  groundWireSize: "10 AWG",
  conduitSize: "1-1/4\"",
  sets: 1,
  maxAmpacity: 70,
  maxLength: 500,        // when no runLength
  voltageDrop: 2.5,      // when runLength provided
  voltageAtLoad: 205.5,
  voltageDropPercent: 1.2,
  isOptimal: true
}
```

### `findOptimalWireSize()`
**NEW in v3.0** - Handles run length based sizing
**Purpose:** Find smallest wire that meets voltage drop limit
**Algorithm:**
1. Try 1-6 parallel sets
2. For each set, try wire sizes 14 AWG → 1000 kcmil
3. Calculate voltage drop: `VD = (multiplier × R × I × L) / 1000`
4. Check if `VD ≤ maxAllowed`
5. Return first wire that fits

### `getAmpacity()`
**NEW in v3.0** - Properly uses temperature rating
**Replaces:** Hardcoded 75°C lookup
**Now:** Looks up actual value from NEC 310.16 based on:
- Wire size
- Conductor type (copper/aluminum)
- Temperature rating (60/75/90°C)

### `getAdjustmentFactor()`
**NEW in v3.0** - NEC 310.15(B)(2) derating
**Applies:** When >3 conductors in same conduit
**Factors:**
- 4-6 conductors: × 0.8
- 7-9 conductors: × 0.7
- 10-20 conductors: × 0.5
- etc.

---

## 🎨 Design System

### Colors (Indigo/Purple Theme)
- **Primary:** `indigo-600` (#4f46e5)
- **Secondary:** `purple-600` (#9333ea)
- **Accent:** `green-600` (for success states)
- **Background:** `slate-50` / `slate-900` (light/dark)
- **Borders:** `indigo-200` / `indigo-700` (light/dark)

### Component Spacing
- Page padding: `p-4 md:p-8`
- Card spacing: `space-y-6`
- Section spacing: `space-y-4` or `space-y-3`
- Input grid: `gap-2` or `gap-4`

### Typography
- Page title: `text-4xl md:text-5xl font-bold`
- Card title: `text-lg font-semibold`
- Labels: `text-sm font-semibold`
- Body text: `text-sm`
- Small text: `text-xs`

---

## 🧪 Testing Checklist

### Calculation Accuracy
- [ ] 100A @ 208V, 3-Phase, 75°C = Correct ampacity
- [ ] Change to 60°C → Lower ampacity
- [ ] Change to 90°C → Higher ampacity
- [ ] 4 conductors → Ampacity reduced by 0.8
- [ ] 500ft run length → Finds optimal wire

### UI Responsiveness
- [ ] Desktop (3-column): Form | Results | Reference
- [ ] Tablet (2-column): Form/Results stacked | Reference
- [ ] Mobile (1-column): Form → Results → Reference (tabs)
- [ ] Dark mode toggle works
- [ ] Theme persists on reload

### NEC Tables
- [ ] Quick Ref table shows correct wire sizes
- [ ] 310.16 all ampacity values display correctly
- [ ] 250.122 grounding table accurate
- [ ] Annex C conduit fill tables scrollable
- [ ] Adjustment factors explanation clear

### Error Handling
- [ ] Invalid amperage (0, 5000) shows error
- [ ] Invalid voltage shows error
- [ ] Run length >10,000ft shows error
- [ ] No solution for extreme VD shows error message

### History & Saving
- [ ] Save calculation works
- [ ] History tab shows saved items
- [ ] Load calculation restores values
- [ ] Max 20 calculations kept
- [ ] Share button copies link

---

## 📊 Performance Notes

### Bundle Size Improvements
- **Removed:** 40+ unused shadcn/ui components
- **Impact:** ~50-100KB reduction
- **Result:** Faster loads, better performance

### Calculation Performance
- **Debounce:** 300ms on input changes (prevents excessive recalc)
- **Memoization:** Results only recalc when dependencies change
- **Loops:** Optimal wire finder tries ≤ 6 sets × ~25 wire sizes = max 150 iterations

### Rendering Optimization
- **Lazy tabs:** Reference tables render only when selected
- **History:** Keeps max 20 items (limited DOM nodes)
- **Auto-calculate:** 300ms debounce prevents re-render spam

---

## 🔮 Future Enhancement Points

1. **Multi-language support** - i18n for international users
2. **Export/Import** - Save calculations as JSON or CSV
3. **Advanced settings** - Ambient temperature derating
4. **Parallel cable mode** - Calculate 2, 3, or more parallel sets
5. **Installation method** - Free air vs. conduit vs. cable tray
6. **Custom NEC tables** - Allow upload of local NEC data
7. **History persistence** - Save to localStorage/cloud
8. **Favorites** - Mark common configurations
9. **Calculation history chart** - Visualize previous calculations
10. **Mobile app** - React Native version

