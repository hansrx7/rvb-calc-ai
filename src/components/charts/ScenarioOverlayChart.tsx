import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ScenarioInputs, CalculatorOutput } from '../../types/calculator';

interface ScenarioResult {
  scenario: ScenarioInputs;
  output: CalculatorOutput;
}

interface ScenarioOverlayChartProps {
  results: ScenarioResult[];
}

const COLORS = ['#2b6cb0', '#ed8936', '#38a169', '#e53e3e', '#805ad5'];

export function ScenarioOverlayChart({ results }: ScenarioOverlayChartProps) {
  // Use Net Worth for primary overlay
  // Data: [{ month, netWorth1, netWorth2, ... }]
  if (!results.length) return null;
  const maxMonths = Math.max(...results.map(r => r.output.monthlySnapshots.length));
  const lines = results.map((r, i) => ({
    key: `scenario${i+1}`,
    color: COLORS[i % COLORS.length],
    label: `Scenario ${i + 1}`
  }));
  const overlayData = Array.from({ length: maxMonths }, (_, idx) => {
    const row: any = { month: idx + 1 };
    results.forEach((r, i) => {
      const snapshot = r.output.monthlySnapshots[idx];
      row[`netWorth${i + 1}`] = snapshot ? snapshot.buyerNetWorth : null;
    });
    return row;
  });
  return (
    <div className="chart-container">
      <h3 className="chart-title">Scenario Overlay: Net Worth Comparison</h3>
      <div style={{ marginBottom: '16px', background: '#f7fafc', padding: '12px', borderRadius: '8px' }}>
        <strong>Interpretation:</strong> Each line shows the net worth trajectory under a different scenario. Color legend matches scenario selection order.
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={overlayData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis label={{ value: 'Net Worth ($)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          {lines.map((line, idx) => (
            <Line key={line.key} type="monotone" dataKey={`netWorth${idx + 1}`} stroke={line.color} name={line.label} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
