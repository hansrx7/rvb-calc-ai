import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CumulativeCostPoint } from '../../types/calculator';

interface CumulativeCostChartProps {
  data: CumulativeCostPoint[];
}

export function CumulativeCostChart({ data }: CumulativeCostChartProps) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Cumulative Total Costs: Buying vs Renting</h3>
      <div className="chart-description" style={{marginBottom: '16px', background: '#f7fafc', padding: '12px', borderRadius: '8px'}}>
        <strong>Interpretation:</strong> Shows the total amount spent on each path, month by month. Slope indicates burn rate, crossover (if any) shows long-term cost efficiency.
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis label={{ value: 'Cumulative Cost ($)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="cumulativeBuying" stroke="#2b6cb0" name="Buying (Cumulative)" dot={false} />
          <Line type="monotone" dataKey="cumulativeRenting" stroke="#ed8936" name="Renting (Cumulative)" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-description" style={{marginTop: '16px'}}>
        This chart helps illustrate which option consumes more money over your chosen timeline. The difference at the end is your total spent.
      </div>
    </div>
  );
}
