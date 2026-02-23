// src/api/baseUrl.js
const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function normalizeApiBase(value) {
  const trimmed = String(value ?? '').trim().replace(/\/+$/, '');

  // 未設定時は same-origin の `/api` を利用
  if (!trimmed || trimmed === '/api') return '/api';

  // `VITE_API_URL` が `/api` 付きでも無しでも受け入れる
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
}

// API base URL（常に `/api` で終わる）
export function getApiBaseUrl() {
  return normalizeApiBase(API_BASE);
}

// path は先頭に `/` を含むパス（例: '/tracks?foo=1'）
export function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl().replace(/\/+$/, '')}${normalizedPath}`;
}
