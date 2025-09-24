import { authorizedFetch } from './authorizedFetch';
import {
  ClarificationAnswerRequest,
  ClarificationRequest,
  ClarificationSessionState,
  SystemDefaultsResponse,
} from '@/types/clarifications';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Failed to parse response: ${text}`);
  }
}

export async function suggestClarifications(
  request: ClarificationRequest
): Promise<ClarificationSessionState> {
  const response = await authorizedFetch(`${API_BASE}/clarifications/suggest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Clarification API error (${response.status}): ${body}`);
  }

  return parseJson<ClarificationSessionState>(response);
}

export async function respondClarifications(
  request: ClarificationAnswerRequest
): Promise<ClarificationSessionState> {
  const response = await authorizedFetch(`${API_BASE}/clarifications/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Clarification response error (${response.status}): ${body}`);
  }

  return parseJson<ClarificationSessionState>(response);
}

export async function fetchSystemDefaults(): Promise<SystemDefaultsResponse> {
  const response = await authorizedFetch(`${API_BASE}/clarifications/system-defaults`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`System defaults API error (${response.status}): ${body}`);
  }

  return parseJson<SystemDefaultsResponse>(response);
}
