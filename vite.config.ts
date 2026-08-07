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
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Routing
          'vendor-router': ['wouter'],
          // Radix UI components (UI library)
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-slot',
          ],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // Excel utilities
          'vendor-xlsx': ['xlsx'],
          // Icon library
          'vendor-icons': ['lucide-react'],
          // React Query
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
