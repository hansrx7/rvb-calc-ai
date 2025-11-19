import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { LiquidityPoint } from '../../types/calculator';

interface LiquidityTimelineProps {
  data: LiquidityPoint[];
}

export function LiquidityTimeline({ data }: LiquidityTimelineProps) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Liquidity Timeline: Cash/Investments Over Time</h3>
      <div className="chart-description" style={{marginBottom: '16px', background: '#e6fffa', padding: '12px', borderRadius: '8px'}}>
        <strong>Interpretation:</strong> High liquidity means more easily accessible cash or investments. Track how much of your wealth would be "liquid" (easy to access) as a buyer vs renter.
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis label={{ value: 'Liquidity ($)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="homeownerCashAccount" stroke="#38a169" name="Homeowner Cash Account" dot={false} />
          <Line type="monotone" dataKey="renterInvestmentBalance" stroke="#3182ce" name="Renter Investment Balance" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-description" style={{marginTop: '16px'}}>
        Liquid assets are critical for flexibility and emergency needs. This chart shows what you'd have access to during your scenario—homeowners' liquidity is often lower until they sell or tap equity.
      </div>
    </div>
  );
}
