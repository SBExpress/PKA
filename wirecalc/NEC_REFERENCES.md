# NEC References & Standards

This document tracks the NEC (National Electrical Code) tables and standards used in the wirecalc electrical feeder calculator.

## NEC Table C.1 - Maximum Number of Conductors in EMT

**Reference File:** `Table_C.1-Maximum-Number-of-Conductors-in-EMT-.pdf`

**Source:** National Electrical Code (NEC) Article 300, Appendix C

**Application:** Maximum number of THHN, THWN, or THWN-2 conductors that can be installed in EMT (Electrical Metallic Tubing) conduit

**Wire Sizes Covered:**
- Small: 14 AWG through 4 AWG
- Large: 1 AWG through 1000 kcmil

**Conduit Sizes Covered:**
- 1/2", 3/4", 1", 1-1/4", 1-1/2", 2", 2-1/2", 3", 3-1/2", 4"

**Implementation Location:** `lib/wire-calculations-v3.ts`
- **Table Definition:** `necTable_C1_THHN` (lines 238-263)
- **Function:** `calculateConduitSize()` (lines 270-306)

**Usage:**
The calculator uses this table to automatically size EMT conduit based on:
1. Number of phase conductors (varies by circuit type and number of parallel sets)
2. Number of neutral conductors (when applicable)
3. Number of ground conductors (always 1)
4. The selected wire size

**Safety Features:**
- Automatically includes space for ground conductor
- Handles parallel sets (multi-set feeders)
- Accounts for neutral conductors in single-phase circuits
- Includes upsize logic for 3-phase circuits where capacity is tight (≤4 conductors)

## NEC 250.122 - Equipment Grounding Conductor Size

**Implementation Location:** `lib/wire-calculations-v3.ts`
- **Function:** `getGroundWireSize()` (lines 76-104)

**Application:** Determines the minimum size of copper or aluminum equipment grounding conductors based on the rating of the overcurrent protection device (OCPD)

**Standards Covered:**
- 60A through 500A+ OCPD ratings
- Copper and aluminum conductor options

---

## PDF File Location

The NEC Table C.1 reference PDF is stored in the project root:
```
E:\Shaya\Claude AI\PKA\wirecalc\Table_C.1-Maximum-Number-of-Conductors-in-EMT-.pdf
```

This is the authoritative source for the conductor counts in the `necTable_C1_THHN` table.

---

## Verification

All table values have been transcribed directly from the official NEC Table C.1 PDF to ensure NEC compliance.
