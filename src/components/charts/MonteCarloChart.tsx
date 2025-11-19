import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface MonteCarloRun {
  run: number;
  finalBuyerNetWorth: number;
  finalRenterNetWorth: number;
  breakevenMonth: number | null;
}
interface MonteCarloSummary {
  percentile10: number;
  percentile50: number;
  percentile90: number;
}
interface MonteCarloChartProps {
  runs: MonteCarloRun[];
  summary: MonteCarloSummary;
}

export function MonteCarloChart({ runs, summary }: MonteCarloChartProps) {
  // compute net worth delta for each run
  const data = runs.map(run => ({
    run: run.run,
    netWorthDelta: run.finalBuyerNetWorth - run.finalRenterNetWorth
  }));
  return (
    <div className="chart-container">
      <h3 className="chart-title">Monte Carlo Simulation: Outcome Spread</h3>
      <div style={{marginBottom: '16px', background: '#f7fafc', padding: '12px', borderRadius: '8px'}}>
        <strong>Interpretation:</strong> Shows how random market shifts affect the results. Most likely outcome is at the 50th percentile line (median). If most bars are above zero, buying usually "wins." Wide spread means more uncertainty.
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="run" hide />
          <YAxis label={{ value: 'Net Worth Δ ($)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Bar dataKey="netWorthDelta" fill="#805ad5" />
          <ReferenceLine y={summary.percentile10} label="10th %" stroke="#e53e3e" strokeDasharray="3 3" />
          <ReferenceLine y={summary.percentile50} label="Median" stroke="#38a169" strokeDasharray="3 3" />
          <ReferenceLine y={summary.percentile90} label="90th %" stroke="#3182ce" strokeDasharray="3 3" />
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-description" style={{marginTop: '16px'}}>
        <strong>Percentiles (horizontal lines):</strong> 10th: ${Math.round(summary.percentile10).toLocaleString()}, 50th: ${Math.round(summary.percentile50).toLocaleString()}, 90th: ${Math.round(summary.percentile90).toLocaleString()}.
      </div>
    </div>
  );
}
