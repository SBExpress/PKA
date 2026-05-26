# BackCalc

Reverse-engineering estimating calculator — a professional React component for contractors and estimators.

## Features

- **Target Price Input**: Enter the final price to charge the customer
- **Labor/Material Split**: Slider-based allocation (0–100%)
- **Reverse-Engineering Logic**: 
  - Automatically calculates raw labor hours and material costs
  - Accounts for overhead and profit markups
  - Handles material adjustment and tax options
- **Real-Time Calculations**: All outputs update instantly as inputs change
- **Tax Basis Options**:
  - Tax on raw material only
  - Tax on material + overhead + profit
- **Settings Persistence**: Save and restore defaults using localStorage
- **Professional UI**: Clean, responsive layout with detailed breakdown cards

## Project Setup

### Prerequisites
- Node.js (v16+)
- npm

### Installation

```bash
cd backcalc
npm install
```

### Development

```bash
npm run dev
```

Opens the app at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output is in the `dist/` folder.

## Usage

1. **Enter Target Price**: Input the final price you want to charge
2. **Adjust Labor/Material Split**: Use the slider to allocate percentage of target price
3. **Set Parameters**: Configure labor rate, overhead %, profit %, tax rate, etc.
4. **View Breakdown**: See detailed labor and material costs in real-time
5. **Save Settings**: Use the Settings panel to save defaults for future sessions

## Calculation Logic

### Labor Side
```
Raw Labor Cost = Labor Portion ÷ (1 + profit%) ÷ (1 + overhead%)
Labor Hours = Raw Labor Cost ÷ labor rate
```

### Material Side (Tax on Raw Material Only)
```
Raw Material Cost = (Material Portion ÷ (1 + profit%) ÷ (1 + overhead%) ÷ (1 + adjustment%)) ÷ (1 + tax%)
```

### Material Side (Tax on Material + OH + Profit)
```
Raw Material Cost = Material Portion ÷ (1 + tax%) ÷ (1 + profit%) ÷ (1 + overhead%) ÷ (1 + adjustment%)
```

## Output Breakdown

- **Labor Hours**: Total hours needed at the specified labor rate
- **Raw Labor Cost**: Base labor cost (hours × rate)
- **Labor Overhead**: Overhead amount applied to raw labor
- **Labor Profit**: Profit margin applied on top of labor + overhead
- **Raw Material Cost**: Base material cost
- **Material Adjustment**: Additional cost (delivery, handling, etc.)
- **Material Overhead**: Overhead applied to adjusted material
- **Material Profit**: Profit margin on material side
- **Material Tax**: Sales tax (based on selected tax basis)
- **Combined Total**: Labor subtotal + Material total (should match target price)

## Settings

The Settings panel allows you to save defaults for:
- Labor Rate ($/hr)
- Labor Overhead %
- Labor Profit %
- Material Adjustment %
- Material Overhead %
- Material Profit %
- Material Tax %
- Tax Basis toggle
- Default Labor/Material Split

All settings are persisted in localStorage and auto-loaded on page refresh.

## Rounding

All monetary values and hours are rounded to 2 decimal places for accuracy.

## License

MIT
