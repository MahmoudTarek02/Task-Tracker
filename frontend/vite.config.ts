import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/auth": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      "/projects": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      "/tasks": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      "/time-entries": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
