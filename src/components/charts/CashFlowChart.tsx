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
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
          <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.7)" />
          <YAxis label={{ value: 'Monthly Cash Flow ($)', angle: -90, position: 'insideLeft' }} stroke="rgba(255, 255, 255, 0.7)" />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{ backgroundColor: 'rgba(5, 8, 15, 0.85)', border: '1px solid rgba(124, 95, 196, 0.35)', borderRadius: '10px', color: '#f1f5f9', backdropFilter: 'blur(6px)' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          <Line type="monotone" dataKey="homeownerCashFlow" stroke="rgba(124, 95, 196, 0.65)" name="Homeowner Cash Flow" dot={false} />
          <Line type="monotone" dataKey="renterCashFlow" stroke="rgba(80, 140, 210, 0.6)" name="Renter Cash Flow" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
