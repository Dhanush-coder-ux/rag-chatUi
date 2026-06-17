import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:8000';
  const isHttps = apiUrl.startsWith('https');

  return {
    plugins: [react()],

    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: ['frontend'],

      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          ws: true,
          rewriteWsOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          ...(isHttps ? { secure: true } : {}),
        },
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
  };
});