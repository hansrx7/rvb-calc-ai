const DEFAULT_BACKEND_URL = 'http://localhost:8000';

export const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? DEFAULT_BACKEND_URL;

export async function apiFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request to ${path} failed: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<T>;
}
