import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In docker compose the backend is reachable at http://backend:8000 (set via
// BACKEND_ORIGIN); in local dev it defaults to localhost.
const backend = process.env.BACKEND_ORIGIN || 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: backend, changeOrigin: true },
    },
  },
});
