// src/components/charts/AssumptionControls.tsx

import { useState, useEffect } from 'react';
import './AssumptionControls.css';

interface AssumptionControlsProps {
  initialValues: {
    interestRate: number;
    homeAppreciationRate: number;
    rentGrowthRate: number;
    investmentReturnRate: number;
  };
  onAssumptionsChange: (values: {
    interestRate: number;
    homeAppreciationRate: number;
    rentGrowthRate: number;
    investmentReturnRate: number;
  }) => void;
}

export function AssumptionControls({ initialValues, onAssumptionsChange }: AssumptionControlsProps) {
  const [values, setValues] = useState(initialValues);
  const [isExpanded, setIsExpanded] = useState(false);

  // Update local state when initial values change
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (key: keyof typeof values, newValue: number) => {
    const updated = { ...values, [key]: newValue };
    setValues(updated);
    onAssumptionsChange(updated);
  };

  const resetToDefaults = () => {
    setValues(initialValues);
    onAssumptionsChange(initialValues);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="assumption-controls">
      <div className="assumption-controls-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="assumption-controls-title">
          <span className="assumption-controls-icon">⚙️</span>
          <h3>Adjust Assumptions</h3>
          <span className="assumption-controls-subtitle">Explore "what if" scenarios</span>
        </div>
        <button className="assumption-controls-toggle">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="assumption-controls-content">
          <div className="assumption-controls-grid">
            <div className="assumption-control-item">
              <label>
                <span className="assumption-label">Interest Rate</span>
                <span className="assumption-value">{formatPercent(values.interestRate)}</span>
              </label>
              <input
                type="range"
                min="3"
                max="10"
                step="0.1"
                value={values.interestRate}
                onChange={(e) => handleChange('interestRate', parseFloat(e.target.value))}
                className="assumption-slider"
              />
              <div className="assumption-range">
                <span>3%</span>
                <span>10%</span>
              </div>
            </div>

            <div className="assumption-control-item">
              <label>
                <span className="assumption-label">Home Appreciation</span>
                <span className="assumption-value">{formatPercent(values.homeAppreciationRate)}</span>
              </label>
              <input
                type="range"
                min="-2"
                max="8"
                step="0.1"
                value={values.homeAppreciationRate}
                onChange={(e) => handleChange('homeAppreciationRate', parseFloat(e.target.value))}
                className="assumption-slider"
              />
              <div className="assumption-range">
                <span>-2%</span>
                <span>8%</span>
              </div>
            </div>

            <div className="assumption-control-item">
              <label>
                <span className="assumption-label">Rent Growth</span>
                <span className="assumption-value">{formatPercent(values.rentGrowthRate)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="8"
                step="0.1"
                value={values.rentGrowthRate}
                onChange={(e) => handleChange('rentGrowthRate', parseFloat(e.target.value))}
                className="assumption-slider"
              />
              <div className="assumption-range">
                <span>0%</span>
                <span>8%</span>
              </div>
            </div>

            <div className="assumption-control-item">
              <label>
                <span className="assumption-label">Investment Return</span>
                <span className="assumption-value">{formatPercent(values.investmentReturnRate)}</span>
              </label>
              <input
                type="range"
                min="2"
                max="12"
                step="0.1"
                value={values.investmentReturnRate}
                onChange={(e) => handleChange('investmentReturnRate', parseFloat(e.target.value))}
                className="assumption-slider"
              />
              <div className="assumption-range">
                <span>2%</span>
                <span>12%</span>
              </div>
            </div>
          </div>

          <div className="assumption-controls-footer">
            <button onClick={resetToDefaults} className="assumption-reset-btn">
              Reset to Original
            </button>
            <p className="assumption-hint">
              💡 Adjust these assumptions to see how different scenarios affect your financial outlook. All charts update in real-time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

