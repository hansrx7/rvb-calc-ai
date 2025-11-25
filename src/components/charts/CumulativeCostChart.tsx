import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CumulativeCostPoint } from '../../types/calculator';

interface CumulativeCostChartProps {
  data: CumulativeCostPoint[];
}

export function CumulativeCostChart({ data }: CumulativeCostChartProps) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Cumulative Total Costs: Buying vs Renting</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows how your total spending accumulates over time for buying versus renting. Lower lines are better.
      </p>
      <div className="chart-description" style={{marginBottom: '16px', background: 'rgba(30, 30, 40, 0.6)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)', color: 'rgba(255, 255, 255, 0.9)'}}>
        <strong>Interpretation:</strong> Shows the total amount spent on each path, month by month. Slope indicates burn rate, crossover (if any) shows long-term cost efficiency.
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
          <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.7)" />
          <YAxis label={{ value: 'Cumulative Cost ($)', angle: -90, position: 'insideLeft' }} stroke="rgba(255, 255, 255, 0.7)" />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{ backgroundColor: 'rgba(30, 30, 40, 0.95)', border: '1px solid rgba(139, 92, 246, 0.5)', borderRadius: '8px', color: 'white' }}
          />
          <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }} />
          <Line type="monotone" dataKey="cumulativeBuying" stroke="#8b5cf6" name="Buying (Cumulative)" dot={false} />
          <Line type="monotone" dataKey="cumulativeRenting" stroke="#60a5fa" name="Renting (Cumulative)" dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-description" style={{marginTop: '16px'}}>
        This chart helps illustrate which option consumes more money over your chosen timeline. The difference at the end is your total spent.
      </div>
    </div>
  );
}
