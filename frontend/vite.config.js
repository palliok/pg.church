import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Адрес Laravel-бэкенда, на который dev-сервер проксирует запросы к /api.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? 'http://localhost:8300'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: API_PROXY_TARGET, changeOrigin: true },
    },
  },
})
