import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0', // allow connections from Docker network
    port: 5173,

    allowedHosts: ['frontend'], // allow Nginx -> frontend

    proxy: {
      '/rag': {
        target: 'https://rag-app-v1ew.onrender.com',
        changeOrigin: true,
      },
      '/upload': {
        target: 'https://rag-app-v1ew.onrender.com',
        changeOrigin: true,
      },
    },
  },
});