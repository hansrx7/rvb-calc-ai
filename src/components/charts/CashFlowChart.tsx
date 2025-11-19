import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CashFlowPoint } from '../../types/calculator';

interface CashFlowChartProps {
  data: CashFlowPoint[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Monthly Cash Flow: Homeowner vs Renter</h3>
      <div className="chart-description" style={{marginBottom: '16px', background: '#f7fafc', padding: '12px', borderRadius: '8px'}}>
        <strong>Interpretation:</strong> Positive cash flow favors renters; negative favors homeowners. This is the difference between what you'd spend owning minus renting each month.
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis label={{ value: 'Monthly Cash Flow ($)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="homeownerCashFlow" stroke="#2b6cb0" name="Homeowner Cash Flow" dot={false} />
          <Line type="monotone" dataKey="renterCashFlow" stroke="#ed8936" name="Renter Cash Flow" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-description" style={{marginTop: '16px'}}>
        This chart shows the <strong>monthly out-of-pocket difference</strong> between buying and renting. Large positive values mean renting leaves more cash each month to invest.
      </div>
    </div>
  );
}
