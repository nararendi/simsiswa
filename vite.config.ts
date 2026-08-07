import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy semua request /api/dapodik/* → http://localhost:5774/*
      // Ini menghindari CORS karena request diproksikan oleh Vite dev server
      '/api/dapodik': {
        target: 'http://localhost:5774',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dapodik/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[Proxy Dapodik] Error:', err.message);
          });
        },
      },
    },
  },
});
