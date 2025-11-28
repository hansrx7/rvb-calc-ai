// src/components/charts/RentGrowthChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimelinePoint } from '../../types/calculator';

interface RentGrowthChartProps {
  timeline: TimelinePoint[];
}

export function RentGrowthChart({ timeline }: RentGrowthChartProps) {
  // Transform data - show every year
  // Mortgage payment is fixed, so use first month's value
  const monthlyMortgage = timeline[0].mortgagePayment;
  
  const chartData = timeline
    .filter((_, index) => index % 12 === 0 || index === timeline.length - 1)
    .map(point => ({
      year: point.year,
      rent: Math.round(point.rentMonthlyOutflow),
        mortgage: Math.round(monthlyMortgage)
    }));
  
  const finalRent = chartData[chartData.length - 1].rent;
  const rentIncrease = finalRent - chartData[0].rent;
  const percentIncrease = ((rentIncrease / chartData[0].rent) * 100).toFixed(0);
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">Rent Growth vs Fixed Mortgage Over {Math.ceil(timeline.length / 12)} Years</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows how rent is expected to grow over time, based on local market trends and ML estimates. Lower rent growth favors renting.
      </p>
      
      <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.35)' }}>
        <p style={{ margin: 0, fontSize: '15px', color: 'rgba(255, 255, 255, 0.95)', lineHeight: 1.4 }}>
          <strong>Rent grows {percentIncrease}%</strong> over {Math.ceil(timeline.length / 12)} years 
          (from <strong>${chartData[0].rent.toLocaleString()}/mo</strong> to <strong>${finalRent.toLocaleString()}/mo</strong>), 
          while your mortgage stays fixed at <strong>${monthlyMortgage.toLocaleString()}/mo</strong>
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
            stroke="rgba(255, 255, 255, 0.7)"
          />
          <YAxis 
            label={{ value: 'Monthly Payment ($)', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `$${(value / 1000).toFixed(1)}k`;
              }
              return `$${value}`;
            }}
            stroke="rgba(255, 255, 255, 0.7)"
          />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}/mo`}
            labelFormatter={(label) => `Year ${label}`}
            contentStyle={{ backgroundColor: 'rgba(5, 8, 15, 0.85)', border: '1px solid rgba(124, 95, 196, 0.35)', borderRadius: '10px', color: '#f1f5f9', backdropFilter: 'blur(6px)' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          <Line 
            type="monotone" 
            dataKey="rent" 
            stroke="rgba(80, 140, 210, 0.65)" 
            strokeWidth={3}
            name="Monthly Rent"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="mortgage" 
            stroke="rgba(124, 95, 196, 0.65)" 
            strokeWidth={3}
            name="Mortgage Payment"
            dot={false}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}