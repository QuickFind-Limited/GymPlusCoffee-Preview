const DEFAULT_PORT = import.meta.env.VITE_API_PORT ?? "8000";
const envBase = import.meta.env.VITE_API_BASE_URL;
const rawBase = envBase && envBase.trim().length > 0 ? envBase.replace(/\/$/, "") : undefined;

const resolveBaseUrl = () => {
  if (rawBase) {
    return rawBase;
  }
  return `http://localhost:${DEFAULT_PORT}/api/v1`;
};

const stripApiPrefix = (url: string) => {
  if (url.endsWith("/api/v1")) {
    return url.slice(0, -"/api/v1".length);
  }
  return url;
};

export const API_BASE_URL = resolveBaseUrl();
export const API_ROOT_URL = stripApiPrefix(API_BASE_URL);
