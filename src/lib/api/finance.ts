import type { AnalysisResponse, ScenarioInputs } from '../../types/calculator';
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
