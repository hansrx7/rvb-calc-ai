import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CashFlowPoint } from '../../types/calculator';

interface CashFlowChartProps {
  data: CashFlowPoint[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Monthly Cash Flow: Homeowner vs Renter</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows how buying affects your monthly cash flow compared to renting. Positive values favor renting (more cash available).
      </p>
      <div className="chart-description" style={{marginBottom: '16px', background: 'rgba(30, 30, 40, 0.6)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)', color: 'rgba(255, 255, 255, 0.9)'}}>
        <strong>Interpretation:</strong> Positive cash flow favors renters; negative favors homeowners. This is the difference between what you'd spend owning minus renting each month.
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
          <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.7)" />
          <YAxis label={{ value: 'Monthly Cash Flow ($)', angle: -90, position: 'insideLeft' }} stroke="rgba(255, 255, 255, 0.7)" />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{ backgroundColor: 'rgba(30, 30, 40, 0.95)', border: '1px solid rgba(139, 92, 246, 0.5)', borderRadius: '8px', color: 'white' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          <Line type="monotone" dataKey="homeownerCashFlow" stroke="#8b5cf6" name="Homeowner Cash Flow" dot={false} />
          <Line type="monotone" dataKey="renterCashFlow" stroke="#60a5fa" name="Renter Cash Flow" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-description" style={{marginTop: '16px'}}>
        This chart shows the <strong>monthly out-of-pocket difference</strong> between buying and renting. Large positive values mean renting leaves more cash each month to invest.
      </div>
    </div>
  );
}
