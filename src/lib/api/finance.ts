import type { AnalysisResponse, ScenarioInputs, BreakEvenHeatmapPoint, MonteCarloResponse, SensitivityRequest, SensitivityResult, ScenarioRequest, ScenarioResult } from '../../types/calculator';
import { apiFetch } from './client';

export function analyzeScenario(inputs: ScenarioInputs, includeTimeline = false, zipCode?: string, includeMonteCarlo = false): Promise<AnalysisResponse> {
  // Very long timeout for analyze endpoint (180 seconds) - ML predictions and timeline calculations can take time
  // ML model loading (first time) + predictions + 120 months of calculations = can take 60-120 seconds
  return apiFetch<AnalysisResponse>('/api/finance/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs, includeTimeline, zipCode, includeMonteCarlo })
  }, 180000); // 180 second timeout (3 minutes) - ML + timeline calculations are computationally intensive
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

export function fetchMonteCarlo(inputs: ScenarioInputs, runs = 500): Promise<MonteCarloResponse> {
  return apiFetch<MonteCarloResponse>('/api/finance/monte-carlo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs, runs })
  });
}

export function fetchSensitivity(request: SensitivityRequest): Promise<SensitivityResult[]> {
  return apiFetch<SensitivityResult[]>('/api/finance/sensitivity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
}

export function fetchScenarios(request: ScenarioRequest): Promise<ScenarioResult[]> {
  return apiFetch<ScenarioResult[]>('/api/finance/scenarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
}

export interface HeatmapParams {
  base: ScenarioInputs;
  timelines: number[];
  downPayments: number[];
}
