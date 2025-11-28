// src/components/charts/BreakEvenChart.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { AnalysisResult } from '../../types/calculator';

interface BreakEvenChartProps {
  analysis: AnalysisResult;
}

export function BreakEvenChart({ analysis }: BreakEvenChartProps) {
  // Safety checks
  if (!analysis || !analysis.timeline || analysis.timeline.length === 0) {
    console.error('❌ [BreakEvenChart] Invalid analysis data:', { analysis });
    return (
      <div className="chart-container">
        <div className="chart-placeholder">Break-even data is not available.</div>
      </div>
    );
  }
  
  const { timeline, breakEven } = analysis;
  
  console.log('📊 [BreakEvenChart] Rendering with:', {
    timelineLength: timeline.length,
    breakEven,
    firstPoint: timeline[0],
    hasNaN: timeline.some(p => 
      typeof p.netWorthBuy === 'number' && isNaN(p.netWorthBuy) ||
      typeof p.netWorthRent === 'number' && isNaN(p.netWorthRent)
    )
  });
  
  // Transform data for the chart - show net worth difference over time
  const chartData = timeline
    .filter((_, index) => index % 12 === 0 || index === timeline.length - 1) // Every year + final month
    .map(point => ({
      year: point.year ?? 0,
      netWorthDifference: Math.round((point.netWorthBuy ?? 0) - (point.netWorthRent ?? 0)),
      buyerNetWorth: Math.round(point.netWorthBuy ?? 0),
      renterNetWorth: Math.round(point.netWorthRent ?? 0)
    }));

  // Add a starting point at year 0 with the actual month-0 values
  // This shows the real initial positions (buyer spent down payment + closing, renter kept the cash)
  if (chartData.length > 0 && chartData[0].year > 0) {
    // Use the actual month-1 values as our starting point (month-0 equivalent)
    const month0Data = timeline[0];
    if (month0Data) {
      chartData.unshift({
        year: 0,
        netWorthDifference: Math.round(month0Data.netWorthBuy - month0Data.netWorthRent),
        buyerNetWorth: Math.round(month0Data.netWorthBuy),
        renterNetWorth: Math.round(month0Data.netWorthRent)
      });
    }
  }

  // Use break-even from analysis result
  const breakEvenYear = breakEven?.year ?? null;
  
  // Calculate final difference
  

  return (
    <div className="chart-container">
      <h3 className="chart-title">Break-Even Timeline Over {chartData.length > 0 ? chartData[chartData.length - 1].year : Math.ceil(timeline.length / 12)} Years</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows when buying starts to financially beat renting under different conditions. Higher values above zero mean buying is better.
      </p>
      
      <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '8px', border: '2px solid rgba(139, 92, 246, 0.5)' }}>
        <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255, 255, 255, 0.95)' }}>
          {breakEvenYear === 0 ? (
            <>
              <strong>Buying wins from the start</strong> - Buying is advantageous throughout your timeline
            </>
          ) : breakEvenYear ? (
            <>
              <strong>Break-even point: Year {breakEvenYear}</strong> - This is when buying starts paying off vs renting
            </>
          ) : (
            <>
              <strong>Renting wins</strong> - Buying never becomes advantageous over your timeline
            </>
          )}
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
            stroke="rgba(255, 255, 255, 0.7)"
          />
          <YAxis 
            label={{ value: 'Net Worth Difference ($)', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => {
              if (Math.abs(value) >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              } else if (Math.abs(value) >= 1000) {
                return `$${(value / 1000).toFixed(0)}k`;
              }
              return `$${value}`;
            }}
            stroke="rgba(255, 255, 255, 0.7)"
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'netWorthDifference') {
                return [`$${value.toLocaleString()}`, 'Buying Advantage'];
              }
              return [`$${value.toLocaleString()}`, name];
            }}
            contentStyle={{ backgroundColor: 'rgba(5, 8, 15, 0.85)', border: '1px solid rgba(124, 95, 196, 0.35)', borderRadius: '10px', color: '#f1f5f9', backdropFilter: 'blur(6px)' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          
          {/* Zero line (break-even point) */}
          <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.5)" strokeDasharray="5 5" />
          
          <Line 
            type="monotone" 
            dataKey="netWorthDifference" 
            stroke="rgba(124, 95, 196, 0.65)" 
            strokeWidth={3}
            dot={false}
            name="Buying Advantage"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
