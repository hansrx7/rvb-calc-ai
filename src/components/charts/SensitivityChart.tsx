import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SensitivityResult } from '../../types/calculator';

interface SensitivityChartProps {
  results: SensitivityResult[];
}

export function SensitivityChart({ results }: SensitivityChartProps) {
  // Show net worth delta for each variant
  const data = results.map(r => ({
    variant: r.variant,
    netWorthDelta: r.output.summary.finalNetWorthDelta,
    buyerNetWorth: r.output.summary.finalBuyerNetWorth,
    renterNetWorth: r.output.summary.finalRenterNetWorth
  }));
  return (
    <div className="chart-container">
      <h3 className="chart-title">Sensitivity Analysis: Parameter Sweep</h3>
      <div style={{marginBottom: '12px', background: '#ebf8ff', padding: '12px', borderRadius: '8px'}}>
        <strong>Interpretation:</strong> Shows how changing one variable (interest, home price, rent) affects your decision.
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="variant" />
          <YAxis label={{ value: 'Net Worth Δ ($)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Legend />
          <Bar dataKey="netWorthDelta" name="Net Worth Delta" fill="#2b6cb0" />
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-description" style={{marginTop: '16px'}}>
        This chart reveals <strong>which factors matter most</strong> for your scenario. Bars above zero indicate buying fares better, below zero renting is ahead.
      </div>
    </div>
  );
}
