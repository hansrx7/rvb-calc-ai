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
      
      <div className="breakeven-callout" style={{ 
        background: winner === 'Buying' 
          ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' 
          : 'linear-gradient(135deg, #1e293b 0%, #064e3b 100%)'
      }}>
        <p>🏆 <strong>{winner} saves you ${savings.toLocaleString()} over {timelineYears} years!</strong></p>
        <p>The net cost of {winner.toLowerCase()} is ${savings.toLocaleString()} lower.</p>      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="name" />
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
          />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{ backgroundColor: 'white', border: '2px solid #1e293b', borderRadius: '8px' }}
          />
          <Legend />
          <Bar dataKey="netCost" name={`Net Cost (after ${timelineYears} years)`} radius={[8, 8, 0, 0]}>
            <Cell fill="#1e293b" />
            <Cell fill="#f56565" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div style={{ marginTop: '20px', padding: '20px', background: '#f7fafc', borderRadius: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'center' }}>
          <div>
            <h4 style={{ color: '#1e293b', marginBottom: '8px' }}>💰 Buying Breakdown</h4>
            <p style={{ color: 'black' }}><strong>Total Spent:</strong> ${totalBuyingCosts.toLocaleString()}</p>
            <p style={{ color: 'black' }}><strong>Home Value:</strong> ${finalHomeValue.toLocaleString()}</p>
            <p style={{ color: 'black' }}><strong>Net Cost:</strong> ${Math.round(buyingNetCost).toLocaleString()}</p>
          </div>
          <div>
            <h4 style={{ color: '#f56565', marginBottom: '8px' }}>🏠 Renting Breakdown</h4>
            <p style={{ color: 'black' }}><strong>Total Spent:</strong> ${totalRentingCosts.toLocaleString()}</p>
            <p style={{ color: 'black' }}><strong>Investment Value:</strong> ${finalInvestmentValue.toLocaleString()}</p>
            <p style={{ color: 'black' }}><strong>Net Cost:</strong> ${Math.round(rentingNetCost).toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <p className="chart-description" style={{ marginTop: '16px' }}>
        This shows your true cost after {timelineYears} years. <strong>Lower net cost = better financial choice!</strong>
      </p>
    </div>
  );
}