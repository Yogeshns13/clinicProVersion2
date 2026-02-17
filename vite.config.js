// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow connections from any IP
    port: 3000,      // Ensure this matches your desired port
    proxy: {
      '/api': {
        target: 'https://cp-api.techchasesoftwarehost.in',
        changeOrigin: true,
        secure: false,
      },
      '/upload': {
        target: 'https://cp-api.techchasesoftwarehost.in',
        changeOrigin: true,
        secure: false,
      },
      '/file': {
        target: 'https://cp-api.techchasesoftwarehost.in',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});