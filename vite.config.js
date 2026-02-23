import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const configuredApiUrl = (env.VITE_API_URL || '').trim().replace(/\/+$/, '')
  const apiOrigin = configuredApiUrl ? configuredApiUrl.replace(/\/api$/i, '') : null
  const proxy = apiOrigin
    ? {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
        },
        '/images': {
          target: apiOrigin,
          changeOrigin: true,
        },
        '/storage': {
          target: apiOrigin,
          changeOrigin: true,
        },
      }
    : {}

  return {
    plugins: [react()],
    worker: {
      format: 'es',
    },
    server: {
      proxy,
    },
  }
})
