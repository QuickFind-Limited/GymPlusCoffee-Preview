import { supabase } from '@/integrations/supabase/client';

function ensureAuthorizationHeader(headers: Headers, token: string) {
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
}

export async function getSupabaseAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Failed to retrieve Supabase session: ${error.message}`);
  }

  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Authentication is required for this request.');
  }

  return token;
}

export async function authorizedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getSupabaseAccessToken();
  const headers = new Headers(init.headers ?? {});
  ensureAuthorizationHeader(headers, token);

  return fetch(input, {
    ...init,
    headers,
  });
}
