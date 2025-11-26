// src/components/charts/TotalCostChart.tsx
// total costs chart
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { AnalysisResult } from '../../types/calculator';

interface TotalCostChartProps {
  analysis: AnalysisResult;
}

export function TotalCostChart({ analysis }: TotalCostChartProps) {
  // Safety checks
  if (!analysis || !analysis.timeline || analysis.timeline.length === 0) {
    console.error('❌ [TotalCostChart] Invalid analysis data:', { analysis });
    return (
      <div className="chart-container">
        <div className="chart-placeholder">Total cost data is not available.</div>
      </div>
    );
  }
  
  const lastPoint = analysis.timeline[analysis.timeline.length - 1];
  const timelineYears = Math.ceil(analysis.timeline.length / 12);
  
  console.log('📊 [TotalCostChart] Rendering with:', {
    timelineLength: analysis.timeline.length,
    lastPoint,
    totalBuyCost: analysis.totalBuyCost,
    totalRentCost: analysis.totalRentCost,
    hasNaN: Object.values(lastPoint || {}).some(v => typeof v === 'number' && isNaN(v))
  });
  
  const buyerFinalNetWorth = lastPoint?.netWorthBuy ?? 0;
  const renterFinalNetWorth = lastPoint?.netWorthRent ?? 0;
  const totalBuyingCosts = analysis.totalBuyCost ?? 0;
  const totalRentingCosts = analysis.totalRentCost ?? 0;
  const finalHomeValue = lastPoint?.homeValue ?? 0;
  const finalInvestmentValue = lastPoint?.renterInvestmentBalance ?? 0;
  
  // Calculate net cost (what you spent minus what you have)
  const buyingNetCost = totalBuyingCosts - finalHomeValue;
  const rentingNetCost = totalRentingCosts - finalInvestmentValue;
  
  const winner = buyerFinalNetWorth > renterFinalNetWorth ? 'Buying' : 'Renting';
  const savings = Math.abs(buyerFinalNetWorth - renterFinalNetWorth);

  const data = [
    {
      name: 'Buying',
      netCost: Math.round(buyingNetCost),
      spent: Math.round(totalBuyingCosts),
      value: Math.round(finalHomeValue)
    },
    {
      name: 'Renting',
      netCost: Math.round(rentingNetCost),
      spent: Math.round(totalRentingCosts),
      value: Math.round(finalInvestmentValue)
    }
  ];
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">{timelineYears}-Year Total Cost Comparison</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows the total money you spend over time if you buy versus rent. Lower is better.
      </p>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
          <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.7)" />
          <YAxis 
            label={{ value: 'Net Cost ($)', angle: -90, position: 'insideLeft' }}
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
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{ backgroundColor: 'rgba(5, 8, 15, 0.85)', border: '1px solid rgba(124, 95, 196, 0.35)', borderRadius: '10px', color: '#f1f5f9', backdropFilter: 'blur(6px)' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          <Bar dataKey="netCost" name={`Net Cost (after ${timelineYears} years)`} radius={[8, 8, 0, 0]}>
            <Cell fill="rgba(124, 95, 196, 0.55)" />
            <Cell fill="rgba(80, 140, 210, 0.5)" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}