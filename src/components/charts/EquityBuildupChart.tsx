// src/components/charts/EquityBuildupChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimelinePoint } from '../../types/calculator';

interface EquityBuildupChartProps {
  timeline: TimelinePoint[];
}

export function EquityBuildupChart({ timeline }: EquityBuildupChartProps) {
  // Transform data - show every year
  const chartData = timeline
    .filter((_, index) => index % 12 === 0 || index === timeline.length - 1)
    .map(point => {
      const equity = Math.round(point.homeEquity);
      const homeValue = Math.round(point.homeValue);
      const percentOwned = ((equity / homeValue) * 100).toFixed(1);
      
      return {
        year: point.year,
        equity,
        homeValue,
        percentOwned: parseFloat(percentOwned)
      };
    });
  
  const finalEquity = chartData[chartData.length - 1].equity;
  const finalPercent = chartData[chartData.length - 1].percentOwned;
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">Home Equity Buildup Over {Math.ceil(timeline.length / 12)} Years</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows how much of the home you actually own (equity) over time when you buy. Higher is better.
      </p>
      
      <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '8px', border: '2px solid rgba(139, 92, 246, 0.5)' }}>
        <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255, 255, 255, 0.95)' }}>
          <strong>After {Math.ceil(timeline.length / 12)} years:</strong> You'll have <strong>${finalEquity.toLocaleString()}</strong> in equity 
          ({finalPercent}% of your home's value)
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
            stroke="rgba(255, 255, 255, 0.7)"
          />
          <YAxis 
            label={{ value: 'Home Equity ($)', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => {
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `$${(value / 1000).toFixed(0)}k`;
              }
              return `$${value}`;
            }}
            stroke="rgba(255, 255, 255, 0.7)"
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'equity') {
                return [`$${value.toLocaleString()}`, 'Home Equity'];
              }
              return value;
            }}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ backgroundColor: 'rgba(30, 30, 40, 0.95)', border: '1px solid rgba(139, 92, 246, 0.5)', borderRadius: '8px', color: 'white' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          <Line 
            type="monotone" 
            dataKey="equity" 
            stroke="#8b5cf6" 
            strokeWidth={3}
            name="Home Equity"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(30, 30, 40, 0.6)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <h4 style={{ marginBottom: '12px', color: 'rgba(255, 255, 255, 0.95)' }}>What This Shows:</h4>
        <p style={{ marginBottom: '8px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.9)' }}>
          This chart shows how much of your home you actually <strong>own</strong> over time (your equity).
        </p>
        <ul style={{ marginLeft: '20px', lineHeight: '1.8', color: 'rgba(255, 255, 255, 0.9)' }}>
          <li><strong>Early years (0-10):</strong> Most payments go to interest, equity builds slowly</li>
          <li><strong>Middle years (10-20):</strong> More goes to principal, equity builds faster</li>
          <li><strong>Later years (20-30):</strong> Mostly principal payments, equity accelerates</li>
        </ul>
        <p style={{ marginTop: '12px', padding: '12px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '8px', margin: 0, color: 'rgba(255, 255, 255, 0.95)' }}>
          <strong>Key insight:</strong> If you sell early (5-10 years), you won't have much equity due to closing costs 
          and the fact that early payments are mostly interest!
        </p>
      </div>
      
      <p className="chart-description" style={{ marginTop: '16px' }}>
        Your equity = Home value - Remaining mortgage balance
      </p>
    </div>
  );
}