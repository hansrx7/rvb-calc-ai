import React from 'react';
import { ResponsiveContainer } from 'recharts';

interface BreakEvenHeatmapPoint {
  timelineYears: number;
  downPaymentPercent: number;
  breakevenMonth: number | null;
}

interface BreakEvenHeatmapProps {
  points: BreakEvenHeatmapPoint[];
}

function getColor(month: number | null) {
  if (month == null) return '#ccc';
  if (month <= 36) return '#38a169'; // under 3 yrs bright green
  if (month <= 60) return '#68d391';
  if (month <= 108) return '#ecc94b'; // 5-9 yrs yellow
  if (month <= 180) return '#ed8936'; // 10-15 yrs orange
  return '#e53e3e'; // very late/never red
}

export function BreakEvenHeatmap({ points }: BreakEvenHeatmapProps) {
  // Compose unique X (timeline) and Y (downPayment) labels
  const xVals = Array.from(new Set(points.map(p => p.timelineYears))).sort((a,b)=>a-b);
  const yVals = Array.from(new Set(points.map(p => p.downPaymentPercent))).sort((a,b)=>a-b);
  return (
    <div className="chart-container">
      <h3 className="chart-title">Break-Even Heatmap (Timeline × Down Payment)</h3>
      <div style={{marginBottom: '12px', background: '#f7fafc', padding: '12px', borderRadius: '8px'}}>
        <strong>Interpretation:</strong> Each cell shows after how many months buying "breaks even" vs renting for a given timeline and down payment. Earlier = greener!
      </div>
      <ResponsiveContainer width="100%" height={yVals.length * 40 + 100}>
        <table style={{borderCollapse: 'collapse', width:'100%'}}>
          <thead>
            <tr>
              <th style={{padding: 6, background: '#edf2f7'}}></th>
              {xVals.map(x => (<th key={x} style={{padding: 6, background: '#edf2f7'}}>{x} yr</th>))}
            </tr>
          </thead>
          <tbody>
            {yVals.map(y => (
              <tr key={y}>
                <th style={{padding: 6, background: '#edf2f7'}}>{y}%</th>
                {xVals.map(x => {
                  const match = points.find(p => p.timelineYears === x && p.downPaymentPercent === y);
                  return (
                    <td key={x+"_"+y} style={{padding: 4}}>
                      <div style={{height: 36, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, background: getColor(match?.breakevenMonth ?? null)}}>
                        {match?.breakevenMonth != null ? `${Math.round(match.breakevenMonth / 12)} yr` : 'Never'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveContainer>
      <div className="chart-description" style={{marginTop: '16px'}}>
        Use this heatmap to find the best combination of timeline and down payment for fast break-even.
      </div>
    </div>
  );
}
