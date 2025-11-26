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
            contentStyle={{ backgroundColor: 'rgba(5, 8, 15, 0.85)', border: '1px solid rgba(124, 95, 196, 0.35)', borderRadius: '10px', color: '#f1f5f9', backdropFilter: 'blur(6px)' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          <Line 
            type="monotone" 
            dataKey="equity" 
            stroke="rgba(124, 95, 196, 0.65)" 
            strokeWidth={3}
            name="Home Equity"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}