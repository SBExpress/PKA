import React, { useState, useEffect } from 'react';
import './BackCalc.css';

export default function BackCalc() {
  // Main calculator state
  const [targetPrice, setTargetPrice] = useState('');
  const [laborSplit, setLaborSplit] = useState(50);
  const [laborRate, setLaborRate] = useState('');
  const [laborOH, setLaborOH] = useState('');
  const [laborProfit, setLaborProfit] = useState('');
  const [materialAdj, setMaterialAdj] = useState('');
  const [materialOH, setMaterialOH] = useState('');
  const [materialProfit, setMaterialProfit] = useState('');
  const [materialTax, setMaterialTax] = useState('');
  const [taxBasis, setTaxBasis] = useState('raw'); // 'raw' or 'full'

  // UI state
  const [showSettings, setShowSettings] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('backCalcSettings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.laborRate) setLaborRate(settings.laborRate);
        if (settings.laborOH) setLaborOH(settings.laborOH);
        if (settings.laborProfit) setLaborProfit(settings.laborProfit);
        if (settings.materialAdj) setMaterialAdj(settings.materialAdj);
        if (settings.materialOH) setMaterialOH(settings.materialOH);
        if (settings.materialProfit) setMaterialProfit(settings.materialProfit);
        if (settings.materialTax) setMaterialTax(settings.materialTax);
        if (settings.taxBasis) setTaxBasis(settings.taxBasis);
        if (settings.laborSplit) setLaborSplit(settings.laborSplit);
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    }
  }, []);

  // Calculation logic
  const calculate = () => {
    const target = parseFloat(targetPrice) || 0;
    if (target <= 0) return null;

    const lSplit = laborSplit / 100;
    const mSplit = 1 - lSplit;

    const laborPortion = target * lSplit;
    const materialPortion = target * mSplit;

    const lRate = parseFloat(laborRate) || 0;
    const lOH = (parseFloat(laborOH) || 0) / 100;
    const lProfit = (parseFloat(laborProfit) || 0) / 100;
    const mAdj = (parseFloat(materialAdj) || 0) / 100;
    const mOH = (parseFloat(materialOH) || 0) / 100;
    const mProfit = (parseFloat(materialProfit) || 0) / 100;
    const mTax = (parseFloat(materialTax) || 0) / 100;

    // Labor: reverse-engineer hours
    let rawLaborCost = 0;
    if (lRate > 0) {
      rawLaborCost = laborPortion / (1 + lProfit) / (1 + lOH);
    }
    const laborHours = lRate > 0 ? rawLaborCost / lRate : 0;
    const laborOHAmount = rawLaborCost * lOH;
    const laborProfitAmount = (rawLaborCost + laborOHAmount) * lProfit;
    const laborSubtotal = rawLaborCost + laborOHAmount + laborProfitAmount;

    // Material: reverse-engineer raw cost
    let rawMaterialCost = 0;
    if (taxBasis === 'raw') {
      // Tax on raw material only
      rawMaterialCost = (materialPortion / (1 + mProfit) / (1 + mOH) / (1 + mAdj)) / (1 + mTax);
    } else {
      // Tax on material + OH + Profit
      rawMaterialCost = materialPortion / (1 + mTax) / (1 + mProfit) / (1 + mOH) / (1 + mAdj);
    }

    const materialAdjAmount = rawMaterialCost * mAdj;
    const adjustedMaterial = rawMaterialCost + materialAdjAmount;
    const materialOHAmount = adjustedMaterial * mOH;
    const materialProfitAmount = (adjustedMaterial + materialOHAmount) * mProfit;
    const materialSubtotal = adjustedMaterial + materialOHAmount + materialProfitAmount;

    let materialTaxAmount = 0;
    if (taxBasis === 'raw') {
      materialTaxAmount = rawMaterialCost * mTax;
    } else {
      materialTaxAmount = materialSubtotal * mTax;
    }
    const materialTotal = materialSubtotal + materialTaxAmount;

    const combinedTotal = laborSubtotal + materialTotal;

    return {
      laborHours: round(laborHours),
      rawLaborCost: round(rawLaborCost),
      laborOHAmount: round(laborOHAmount),
      laborProfitAmount: round(laborProfitAmount),
      laborSubtotal: round(laborSubtotal),
      rawMaterialCost: round(rawMaterialCost),
      materialAdjAmount: round(materialAdjAmount),
      materialOHAmount: round(materialOHAmount),
      materialProfitAmount: round(materialProfitAmount),
      materialSubtotal: round(materialSubtotal),
      materialTaxAmount: round(materialTaxAmount),
      materialTotal: round(materialTotal),
      combinedTotal: round(combinedTotal),
    };
  };

  const round = (num) => Math.round(num * 100) / 100;
  const formatCurrency = (num) => `$${num.toFixed(2)}`;
  const formatHours = (num) => num.toFixed(2);

  const results = calculate();

  const handleSaveSettings = () => {
    const settings = {
      laborRate,
      laborOH,
      laborProfit,
      materialAdj,
      materialOH,
      materialProfit,
      materialTax,
      taxBasis,
      laborSplit,
    };
    localStorage.setItem('backCalcSettings', JSON.stringify(settings));
    alert('Settings saved!');
  };

  const handleResetSettings = () => {
    if (window.confirm('Clear all saved settings?')) {
      localStorage.removeItem('backCalcSettings');
      setLaborRate('');
      setLaborOH('');
      setLaborProfit('');
      setMaterialAdj('');
      setMaterialOH('');
      setMaterialProfit('');
      setMaterialTax('');
      setTaxBasis('raw');
      setLaborSplit(50);
      setTargetPrice('');
    }
  };

  return (
    <div className="backcalc-container">
      <header className="backcalc-header">
        <h1>BackCalc</h1>
        <p>Reverse-engineer labor hours and material costs from target price</p>
      </header>

      <div className="backcalc-main">
        {/* Settings Toggle */}
        <div className="settings-toggle">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="settings-btn"
            title="Show/hide settings"
          >
            ⚙️ {showSettings ? 'Hide' : 'Settings'}
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="settings-panel">
            <h2>Settings</h2>
            <div className="settings-grid">
              <div className="setting-group">
                <label>Labor Rate ($/hr)</label>
                <input
                  type="number"
                  value={laborRate}
                  onChange={(e) => setLaborRate(e.target.value)}
                  placeholder="50"
                />
              </div>
              <div className="setting-group">
                <label>Labor Overhead %</label>
                <input
                  type="number"
                  value={laborOH}
                  onChange={(e) => setLaborOH(e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="setting-group">
                <label>Labor Profit %</label>
                <input
                  type="number"
                  value={laborProfit}
                  onChange={(e) => setLaborProfit(e.target.value)}
                  placeholder="20"
                />
              </div>
              <div className="setting-group">
                <label>Material Adjustment %</label>
                <input
                  type="number"
                  value={materialAdj}
                  onChange={(e) => setMaterialAdj(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="setting-group">
                <label>Material Overhead %</label>
                <input
                  type="number"
                  value={materialOH}
                  onChange={(e) => setMaterialOH(e.target.value)}
                  placeholder="15"
                />
              </div>
              <div className="setting-group">
                <label>Material Profit %</label>
                <input
                  type="number"
                  value={materialProfit}
                  onChange={(e) => setMaterialProfit(e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="setting-group">
                <label>Material Tax %</label>
                <input
                  type="number"
                  value={materialTax}
                  onChange={(e) => setMaterialTax(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="setting-group">
                <label>Tax Basis</label>
                <select value={taxBasis} onChange={(e) => setTaxBasis(e.target.value)}>
                  <option value="raw">Tax on raw material only</option>
                  <option value="full">Tax on material + OH + profit</option>
                </select>
              </div>
              <div className="setting-group">
                <label>Default Labor/Material Split (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={laborSplit}
                  onChange={(e) => setLaborSplit(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                />
              </div>
            </div>
            <div className="settings-buttons">
              <button onClick={handleSaveSettings} className="save-btn">
                Save Settings
              </button>
              <button onClick={handleResetSettings} className="reset-btn">
                Reset to Defaults
              </button>
            </div>
          </div>
        )}

        {/* Main Calculator */}
        <div className="calculator-panel">
          <div className="input-section">
            <h2>Target Price & Split</h2>

            <div className="input-group">
              <label>Target Price ($)</label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="10000"
                className="large-input"
              />
            </div>

            <div className="split-section">
              <div className="split-labels">
                <span>Labor: {laborSplit}%</span>
                <span>Material: {100 - laborSplit}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={laborSplit}
                onChange={(e) => setLaborSplit(parseFloat(e.target.value))}
                className="split-slider"
              />
            </div>

            {/* Dynamic parameter inputs based on split */}
            <div className="params-grid">
              <div className="param-group">
                <label>Labor Rate ($/hr)</label>
                <input
                  type="number"
                  value={laborRate}
                  onChange={(e) => setLaborRate(e.target.value)}
                  placeholder="50"
                />
              </div>
              <div className="param-group">
                <label>Labor OH %</label>
                <input
                  type="number"
                  value={laborOH}
                  onChange={(e) => setLaborOH(e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="param-group">
                <label>Labor Profit %</label>
                <input
                  type="number"
                  value={laborProfit}
                  onChange={(e) => setLaborProfit(e.target.value)}
                  placeholder="20"
                />
              </div>
              <div className="param-group">
                <label>Material Adj %</label>
                <input
                  type="number"
                  value={materialAdj}
                  onChange={(e) => setMaterialAdj(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="param-group">
                <label>Material OH %</label>
                <input
                  type="number"
                  value={materialOH}
                  onChange={(e) => setMaterialOH(e.target.value)}
                  placeholder="15"
                />
              </div>
              <div className="param-group">
                <label>Material Profit %</label>
                <input
                  type="number"
                  value={materialProfit}
                  onChange={(e) => setMaterialProfit(e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="param-group">
                <label>Material Tax %</label>
                <input
                  type="number"
                  value={materialTax}
                  onChange={(e) => setMaterialTax(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="param-group">
                <label>Tax Basis</label>
                <select value={taxBasis} onChange={(e) => setTaxBasis(e.target.value)}>
                  <option value="raw">Raw material only</option>
                  <option value="full">Material + OH + profit</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {results && targetPrice && (
            <div className="results-section">
              <h2>Breakdown</h2>
              <div className="results-grid">
                {/* Labor Breakdown */}
                <div className="breakdown-card labor-card">
                  <h3>Labor</h3>
                  <div className="result-row">
                    <span>Hours Needed</span>
                    <strong>{formatHours(results.laborHours)}</strong>
                  </div>
                  <div className="result-row">
                    <span>Raw Cost</span>
                    <span>{formatCurrency(results.rawLaborCost)}</span>
                  </div>
                  <div className="result-row">
                    <span>+ Overhead</span>
                    <span>{formatCurrency(results.laborOHAmount)}</span>
                  </div>
                  <div className="result-row">
                    <span>+ Profit</span>
                    <span>{formatCurrency(results.laborProfitAmount)}</span>
                  </div>
                  <div className="result-row total">
                    <span>Subtotal</span>
                    <strong>{formatCurrency(results.laborSubtotal)}</strong>
                  </div>
                </div>

                {/* Material Breakdown */}
                <div className="breakdown-card material-card">
                  <h3>Material</h3>
                  <div className="result-row">
                    <span>Raw Cost</span>
                    <span>{formatCurrency(results.rawMaterialCost)}</span>
                  </div>
                  <div className="result-row">
                    <span>+ Adjustment</span>
                    <span>{formatCurrency(results.materialAdjAmount)}</span>
                  </div>
                  <div className="result-row">
                    <span>+ Overhead</span>
                    <span>{formatCurrency(results.materialOHAmount)}</span>
                  </div>
                  <div className="result-row">
                    <span>+ Profit</span>
                    <span>{formatCurrency(results.materialProfitAmount)}</span>
                  </div>
                  <div className="result-row">
                    <span>+ Tax</span>
                    <span>{formatCurrency(results.materialTaxAmount)}</span>
                  </div>
                  <div className="result-row total">
                    <span>Total</span>
                    <strong>{formatCurrency(results.materialTotal)}</strong>
                  </div>
                </div>
              </div>

              {/* Combined Total */}
              <div className="combined-total">
                <div className="total-row">
                  <span>Combined Total</span>
                  <strong className={results.combinedTotal === round(parseFloat(targetPrice)) ? 'match' : 'mismatch'}>
                    {formatCurrency(results.combinedTotal)}
                  </strong>
                </div>
                <div className="target-row">
                  <span>Target Price</span>
                  <strong>{formatCurrency(parseFloat(targetPrice))}</strong>
                </div>
                {Math.abs(results.combinedTotal - round(parseFloat(targetPrice))) > 0.01 && (
                  <div className="warning">
                    ⚠️ Total does not match target (rounding difference: {formatCurrency(Math.abs(results.combinedTotal - round(parseFloat(targetPrice))))})
                  </div>
                )}
              </div>
            </div>
          )}

          {!targetPrice && (
            <div className="empty-state">
              <p>Enter a target price to see the breakdown</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
