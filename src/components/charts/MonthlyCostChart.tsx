// src/components/charts/MonthlyCostChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { TimelinePoint } from '../../types/calculator';

interface MonthlyCostChartProps {
  timeline: TimelinePoint[];
}

export function MonthlyCostChart({ timeline }: MonthlyCostChartProps) {
  // Use first month's data for monthly costs
  const firstPoint = timeline[0];
  
  const buyingCosts = {
    mortgage: firstPoint.mortgagePayment,
    propertyTax: firstPoint.propertyTaxMonthly,
    insurance: firstPoint.insuranceMonthly,
    hoa: firstPoint.hoaMonthly,
    maintenance: firstPoint.maintenanceMonthly,
    total: firstPoint.buyMonthlyOutflow,
  };
  
  const rentingCosts = {
    rent: firstPoint.rentMonthlyOutflow,
    insurance: 0, // Not tracked in unified structure
    total: firstPoint.rentMonthlyOutflow,
  };
  // Prepare data for the chart
  const data = [
    {
      name: 'Buying',
      total: Math.round(buyingCosts.total),
      color: '#8b5cf6'
    },
    {
      name: 'Renting',
      total: Math.round(rentingCosts.total),
      color: '#60a5fa'
    }
  ];
  
  // Breakdown data for tooltip
  const buyingBreakdown = [
    { label: 'Mortgage', value: buyingCosts.mortgage },
    { label: 'Property Tax', value: buyingCosts.propertyTax },
    { label: 'Home Insurance', value: buyingCosts.insurance },
    { label: 'HOA', value: buyingCosts.hoa },
    { label: 'Maintenance', value: buyingCosts.maintenance }
  ];
  
  const rentingBreakdown = [
    { label: 'Rent', value: rentingCosts.rent },
    { label: 'Renter\'s Insurance', value: rentingCosts.insurance }
  ];
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">Monthly Cost Comparison</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This compares your monthly cost of buying (mortgage + taxes + other costs) versus renting. Lower bars are better.
      </p>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
          <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.7)" />
          <YAxis 
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
            contentStyle={{ backgroundColor: 'rgba(30, 30, 40, 0.95)', border: '1px solid rgba(139, 92, 246, 0.5)', borderRadius: '8px', color: 'white' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          <Bar dataKey="total" name="Monthly Cost" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Breakdown sections */}
      <div className="cost-breakdown">
        <div className="breakdown-column">
          <h4 style={{ color: 'rgba(139, 92, 246, 0.9)' }}>Buying Breakdown</h4>
          {buyingBreakdown.map(item => (
            <div key={item.label} className="breakdown-item">
              <span>{item.label}:</span>
              <span>${Math.round(item.value).toLocaleString()}/mo</span>
            </div>
          ))}
          <div className="breakdown-item breakdown-total">
            <span><strong>Total:</strong></span>
            <span><strong>${Math.round(buyingCosts.total).toLocaleString()}/mo</strong></span>
          </div>
        </div>
        
        <div className="breakdown-column">
          <h4 style={{ color: 'rgba(96, 165, 250, 0.9)' }}>Renting Breakdown</h4>
          {rentingBreakdown.map(item => (
            <div key={item.label} className="breakdown-item">
              <span>{item.label}:</span>
              <span>${Math.round(item.value).toLocaleString()}/mo</span>
            </div>
          ))}
          <div className="breakdown-item breakdown-total">
            <span><strong>Total:</strong></span>
            <span><strong>${Math.round(rentingCosts.total).toLocaleString()}/mo</strong></span>
          </div>
        </div>
      </div>
      
      <p className="chart-description">
        This shows your monthly costs in the first year. Rent will increase over time.
      </p>
    </div>
  );
}