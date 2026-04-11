import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/rag': {
        target:"https://rag-app-v1ew.onrender.com",
        changeOrigin: true,
      },
      '/upload': {
        target:"https://rag-app-v1ew.onrender.com",
        changeOrigin: true,
      },
    },
  },
});
