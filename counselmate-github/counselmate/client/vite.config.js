import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the browser talks only to :5173. Vite forwards /api calls to the Express
// server on :5000. That keeps everything on one origin, so the login cookie "just works".
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5000' },
  },
});
