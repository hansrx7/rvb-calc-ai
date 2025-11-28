import type { AnalysisResponse, ScenarioInputs, BreakEvenHeatmapPoint } from '../../types/calculator';
import { apiFetch } from './client';

export function analyzeScenario(inputs: ScenarioInputs, includeTimeline = false): Promise<AnalysisResponse> {
  return apiFetch<AnalysisResponse>('/api/finance/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs, includeTimeline })
  });
}

export function fetchBreakEvenHeatmap(params: HeatmapParams): Promise<BreakEvenHeatmapPoint[]> {
  return apiFetch<BreakEvenHeatmapPoint[]>('/api/finance/heatmap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
}

export interface HeatmapParams {
  base: ScenarioInputs;
  timelines: number[];
  downPayments: number[];
}
