import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TaxSavingsPoint } from '../../types/calculator';

interface TaxSavingsChartProps {
  data: TaxSavingsPoint[];
}

export function TaxSavingsChart({ data }: TaxSavingsChartProps) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Annual Tax Savings from Buying</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows estimated tax savings from owning a home versus renting. Higher bars mean more tax savings (better).
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
          <XAxis dataKey="year" stroke="rgba(255, 255, 255, 0.7)" />
          <YAxis label={{ value: 'Annual Tax Savings ($)', angle: -90, position: 'insideLeft' }} stroke="rgba(255, 255, 255, 0.7)" />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{ backgroundColor: 'rgba(5, 8, 15, 0.85)', border: '1px solid rgba(124, 95, 196, 0.35)', borderRadius: '10px', color: '#f1f5f9', backdropFilter: 'blur(6px)' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          <Bar dataKey="deductibleMortgageInterest" name="Deductible Mortgage Interest" fill="rgba(124, 95, 196, 0.55)" />
          <Bar dataKey="deductiblePropertyTax" name="Deductible Property Tax" fill="rgba(80, 140, 210, 0.5)" />
          <Bar dataKey="totalTaxBenefit" name="Total Tax Benefit" fill="rgba(149, 128, 210, 0.55)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
