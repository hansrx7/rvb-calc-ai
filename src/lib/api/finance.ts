import type { AnalysisResponse, ScenarioInputs, BreakEvenHeatmapPoint, MonteCarloResponse, SensitivityRequest, SensitivityResult, ScenarioRequest, ScenarioResult } from '../../types/calculator';
import { apiFetch } from './client';

export function analyzeScenario(inputs: ScenarioInputs, includeTimeline = false, zipCode?: string): Promise<AnalysisResponse> {
  return apiFetch<AnalysisResponse>('/api/finance/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs, includeTimeline, zipCode })
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
