import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiOrigin = (env.VITE_API_URL || 'http://127.0.0.1:8000')
    .replace(/\/+$/, '')
    .replace(/\/api$/i, '')

  return {
    plugins: [react()],
    worker: {
      format: 'es',
    },
    server: {
      proxy: {
        '/images': {
          target: apiOrigin,
          changeOrigin: true,
        },
        '/storage': {
          target: apiOrigin,
          changeOrigin: true,
        },
      },
    },
  }
})
