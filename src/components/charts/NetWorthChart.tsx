// src/components/charts/NetWorthChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimelinePoint } from '../../types/calculator';

interface NetWorthChartProps {
  timeline: TimelinePoint[];
}

export function NetWorthChart({ timeline }: NetWorthChartProps) {
  // Transform data for the chart
  // We'll show data points every 12 months (yearly) to keep it clean
  const chartData = timeline
    .filter((_, index) => index % 12 === 0 || index === timeline.length - 1) // Every year + final month
    .map(point => ({
      year: point.year,
      buying: Math.round(point.netWorthBuy),
      renting: Math.round(point.netWorthRent)
    }));
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">Net Worth Comparison Over {Math.ceil(timeline.length / 12)} Years</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows how your net worth changes over time if you buy versus rent. Higher lines are better.
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
            label={{ value: 'Net Worth ($)', angle: -90, position: 'insideLeft' }}
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
            formatter={(value: number) => `$${value.toLocaleString()}`}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ backgroundColor: 'rgba(5, 8, 15, 0.85)', border: '1px solid rgba(124, 95, 196, 0.35)', borderRadius: '10px', color: '#f1f5f9', backdropFilter: 'blur(6px)' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          <Line 
            type="monotone" 
            dataKey="buying" 
            stroke="rgba(124, 95, 196, 0.65)" 
            strokeWidth={3}
            name="Buying"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="renting" 
            stroke="rgba(80, 140, 210, 0.6)" 
            strokeWidth={3}
            name="Renting"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}