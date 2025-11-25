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
      <div className="chart-description" style={{marginBottom: '16px', background: 'rgba(30, 30, 40, 0.6)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)', color: 'rgba(255, 255, 255, 0.9)'}}>
        <strong>Interpretation:</strong> Shows how much you could save on taxes each year from your mortgage interest and property tax deductions (subject to IRS limits).
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
          <XAxis dataKey="year" stroke="rgba(255, 255, 255, 0.7)" />
          <YAxis label={{ value: 'Annual Tax Savings ($)', angle: -90, position: 'insideLeft' }} stroke="rgba(255, 255, 255, 0.7)" />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{ backgroundColor: 'rgba(30, 30, 40, 0.95)', border: '1px solid rgba(139, 92, 246, 0.5)', borderRadius: '8px', color: 'white' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          <Bar dataKey="deductibleMortgageInterest" name="Deductible Mortgage Interest" fill="#8b5cf6" />
          <Bar dataKey="deductiblePropertyTax" name="Deductible Property Tax" fill="#60a5fa" />
          <Bar dataKey="totalTaxBenefit" name="Total Tax Benefit" fill="#a78bfa" />
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-description" style={{marginTop: '16px'}}>
        The <strong>total tax benefit</strong> depends on your income, filing status, and whether you itemize deductions. These figures use common federal deduction limits: $750,000 max mortgage interest, $10,000 SALT (state/local/property) tax cap.
      </div>
    </div>
  );
}
