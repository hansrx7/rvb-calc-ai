import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TaxSavingsPoint } from '../../types/calculator';

interface TaxSavingsChartProps {
  data: TaxSavingsPoint[];
}

export function TaxSavingsChart({ data }: TaxSavingsChartProps) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Annual Tax Savings from Buying</h3>
      <div className="chart-description" style={{marginBottom: '16px', background: '#fffbea', padding: '12px', borderRadius: '8px'}}>
        <strong>Interpretation:</strong> Shows how much you could save on taxes each year from your mortgage interest and property tax deductions (subject to IRS limits).
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis label={{ value: 'Annual Tax Savings ($)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Legend />
          <Bar dataKey="deductibleMortgageInterest" name="Deductible Mortgage Interest" fill="#2b6cb0" />
          <Bar dataKey="deductiblePropertyTax" name="Deductible Property Tax" fill="#ed8936" />
          <Bar dataKey="totalTaxBenefit" name="Total Tax Benefit" fill="#38a169" />
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-description" style={{marginTop: '16px'}}>
        The <strong>total tax benefit</strong> depends on your income, filing status, and whether you itemize deductions. These figures use common federal deduction limits: $750,000 max mortgage interest, $10,000 SALT (state/local/property) tax cap.
      </div>
    </div>
  );
}
