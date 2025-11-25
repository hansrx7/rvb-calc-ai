import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { LiquidityPoint } from '../../types/calculator';

interface LiquidityTimelineProps {
  data: LiquidityPoint[];
}

export function LiquidityTimeline({ data }: LiquidityTimelineProps) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Liquidity Timeline: Cash/Investments Over Time</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows how much liquid cash you keep under different scenarios over time. Higher values mean more accessible cash (better for flexibility).
      </p>
      <div className="chart-description" style={{marginBottom: '16px', background: 'rgba(30, 30, 40, 0.6)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)', color: 'rgba(255, 255, 255, 0.9)'}}>
        <strong>Interpretation:</strong> High liquidity means more easily accessible cash or investments. Track how much of your wealth would be "liquid" (easy to access) as a buyer vs renter.
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
          <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.7)" />
          <YAxis label={{ value: 'Liquidity ($)', angle: -90, position: 'insideLeft' }} stroke="rgba(255, 255, 255, 0.7)" />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{ backgroundColor: 'rgba(30, 30, 40, 0.95)', border: '1px solid rgba(139, 92, 246, 0.5)', borderRadius: '8px', color: 'white' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          <Line type="monotone" dataKey="homeownerCashAccount" stroke="#8b5cf6" name="Homeowner Cash Account" dot={false} />
          <Line type="monotone" dataKey="renterInvestmentBalance" stroke="#60a5fa" name="Renter Investment Balance" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-description" style={{marginTop: '16px'}}>
        Liquid assets are critical for flexibility and emergency needs. This chart shows what you'd have access to during your scenario—homeowners' liquidity is often lower until they sell or tap equity.
      </div>
    </div>
  );
}
