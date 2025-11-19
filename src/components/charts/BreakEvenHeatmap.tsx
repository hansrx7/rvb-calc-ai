import React from 'react';
import type { BreakEvenHeatmapPoint } from '../../types/calculator';

interface BreakEvenHeatmapProps {
  points: BreakEvenHeatmapPoint[];
}

function getColor(month: number | null) {
  if (month == null) return '#e2e8f0';
  if (month <= 36) return '#c6f6d5'; // under 3 yrs light green
  if (month <= 60) return '#fefcbf'; // light yellow
  if (month <= 108) return '#feebc8'; // light orange
  if (month <= 180) return '#fed7d7'; // light red
  return '#fc8181'; // darker red for very late
}

export function BreakEvenHeatmap({ points }: BreakEvenHeatmapProps) {
  // Compose unique X (timeline) and Y (downPayment) labels
  const xVals = Array.from(new Set(points.map(p => p.timelineYears))).sort((a,b)=>a-b);
  const yVals = Array.from(new Set(points.map(p => p.downPaymentPercent))).sort((a,b)=>a-b);
  return (
    <div className="chart-container">
      <h3 className="chart-title">Break-Even Heatmap (Timeline × Down Payment)</h3>
      <div style={{marginBottom: '12px', background: '#f7fafc', padding: '12px', borderRadius: '8px', color: '#1a202c'}}>
        <strong>Interpretation:</strong> Each cell shows after how many months buying "breaks even" vs renting for a given timeline and down payment. Earlier = greener!
      </div>
      <div style={{width: '100%', overflowX: 'auto'}}>
        <table style={{borderCollapse: 'collapse', width:'100%', minWidth: '500px'}}>
          <thead>
            <tr>
              <th style={{padding: '12px', background: '#edf2f7', fontWeight: '600', fontSize: '14px', color: '#1a202c', border: '1px solid #cbd5e0'}}></th>
              {xVals.map(x => (
                <th key={x} style={{padding: '12px', background: '#edf2f7', fontWeight: '600', fontSize: '14px', color: '#1a202c', border: '1px solid #cbd5e0', textAlign: 'center', minWidth: '80px'}}>
                  {x} yr
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yVals.map(y => (
              <tr key={y}>
                <th style={{padding: '12px', background: '#edf2f7', fontWeight: '600', fontSize: '14px', color: '#1a202c', border: '1px solid #cbd5e0', textAlign: 'center'}}>
                  {y}%
                </th>
                {xVals.map(x => {
                  const match = points.find(p => p.timelineYears === x && p.downPaymentPercent === y);
                  return (
                    <td key={x+"_"+y} style={{padding: '8px', border: '1px solid #cbd5e0'}}>
                      <div style={{
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        background: getColor(match?.breakevenMonth ?? null),
                        fontWeight: '600',
                        fontSize: '14px',
                        color: '#1a202c'
                      }}>
                        {match?.breakevenMonth != null ? `${Math.round(match.breakevenMonth / 12)} yr` : 'Never'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="chart-description" style={{marginTop: '16px'}}>
        Use this heatmap to find the best combination of timeline and down payment for fast break-even.
      </div>
    </div>
  );
}
