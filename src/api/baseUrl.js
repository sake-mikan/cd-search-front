export function getApiOrigin() {
  const raw = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').trim();
  const noTrailingSlash = raw.replace(/\/+$/, '');
  return noTrailingSlash.replace(/\/api$/i, '');
}
