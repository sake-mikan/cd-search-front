const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

function normalizeApiBase(value) {
  const trimmed = String(value ?? '').trim().replace(/\/+$/, '');

  if (!trimmed || trimmed === '/api') return '/api';

  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
}

export function getApiBaseUrl() {
  const base = normalizeApiBase(API_BASE);
  
  // サーバーサイド実行かつベースが相対パスの場合のフォールバック
  if (typeof window === 'undefined' && base.startsWith('/')) {
    const internalUrl = process.env.INTERNAL_API_URL || 'http://localhost:8000';
    return `${internalUrl}${base}`;
  }
  
  return base;
}

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return `${base.replace(/\/+$/, '')}${normalizedPath}`;
}
