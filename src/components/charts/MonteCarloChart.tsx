import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import type { HomePricePathSummary } from '../../types/calculator';

interface MonteCarloChartProps {
  monteCarloHomePrices?: HomePricePathSummary | null;
}

export function MonteCarloChart({ monteCarloHomePrices }: MonteCarloChartProps) {
  console.log('🎲 [MC DEBUG] MonteCarloChart render:', {
    hasProps: !!monteCarloHomePrices,
    hasYears: !!monteCarloHomePrices?.years,
    yearsLength: monteCarloHomePrices?.years?.length,
    hasP10: !!monteCarloHomePrices?.p10,
    p10Length: monteCarloHomePrices?.p10?.length,
    hasP50: !!monteCarloHomePrices?.p50,
    p50Length: monteCarloHomePrices?.p50?.length,
    hasP90: !!monteCarloHomePrices?.p90,
    p90Length: monteCarloHomePrices?.p90?.length,
    sampleData: monteCarloHomePrices ? {
      firstYear: monteCarloHomePrices.years?.[0],
      firstP10: monteCarloHomePrices.p10?.[0],
      firstP50: monteCarloHomePrices.p50?.[0],
      firstP90: monteCarloHomePrices.p90?.[0],
      lastYear: monteCarloHomePrices.years?.[monteCarloHomePrices.years?.length - 1],
      lastP50: monteCarloHomePrices.p50?.[monteCarloHomePrices.p50?.length - 1]
    } : null
  });
  
  // Check if data is available
  if (!monteCarloHomePrices || 
      !monteCarloHomePrices.years || 
      monteCarloHomePrices.years.length === 0 ||
      !monteCarloHomePrices.p10 || 
      !monteCarloHomePrices.p50 || 
      !monteCarloHomePrices.p90) {
    console.log('🎲 [MC DEBUG] MonteCarloChart: No data available, showing placeholder');
    return (
      <div className="chart-container">
        <div className="chart-placeholder">
          No Monte Carlo data available.
        </div>
      </div>
    );
  }

  // Transform data for the chart
  const chartData = monteCarloHomePrices.years.map((year, index) => ({
    year,
    p10: Math.round(monteCarloHomePrices.p10[index]),
    p50: Math.round(monteCarloHomePrices.p50[index]),
    p90: Math.round(monteCarloHomePrices.p90[index])
  }));
  
  console.log('🎲 [MC DEBUG] MonteCarloChart: Chart data prepared:', {
    chartDataLength: chartData.length,
    firstPoint: chartData[0],
    lastPoint: chartData[chartData.length - 1]
  });

  const finalYear = chartData[chartData.length - 1]?.year ?? 0;
  const initialPrice = chartData[0]?.p50 ?? 0;
  const finalPriceP50 = chartData[chartData.length - 1]?.p50 ?? 0;
  const priceChange = finalPriceP50 - initialPrice;
  const priceChangePct = initialPrice > 0 ? ((priceChange / initialPrice) * 100) : 0;

  return (
    <div className="chart-container">
      <h3 className="chart-title">Simulated Home Value Range</h3>
      <p className="chart-caption" style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
        This shows best, typical, and worst-case home values over time based on ML estimates and market volatility. The shaded band is the range; the middle line is the typical path.
      </p>
      
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3182ce" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3182ce" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            label={{ value: 'Home Value ($)', angle: -90, position: 'insideLeft' }}
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
            contentStyle={{ backgroundColor: 'rgba(5, 8, 15, 0.85)', border: '1px solid rgba(124, 95, 196, 0.35)', borderRadius: '10px', color: '#f1f5f9', backdropFilter: 'blur(6px)' }}
            labelFormatter={(year) => `Year ${year}`}
          />
          <Legend />
          
          {/* Shaded area between p10 and p90 */}
          <Area
            type="monotone"
            dataKey="p90"
            stroke="none"
            fill="url(#colorBand)"
            fillOpacity={0.3}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="p10"
            stroke="none"
            fill="#fff"
            fillOpacity={1}
            connectNulls
          />
          
          {/* Median line (p50) */}
          <Line 
            type="monotone" 
            dataKey="p50" 
            stroke="#38a169" 
            strokeWidth={3}
            dot={false}
            name="Median (50th percentile)"
          />
          
          {/* Upper and lower bounds as lines */}
          <Line 
            type="monotone" 
            dataKey="p90" 
            stroke="#3182ce" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="90th percentile"
          />
          <Line 
            type="monotone" 
            dataKey="p10" 
            stroke="#e53e3e" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="10th percentile"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
