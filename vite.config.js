import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
        },
        '/upload': {
          target: env.VITE_FTP_BASE_URL,
          changeOrigin: true,
          secure: false,
        },
        '/file': {
          target: env.VITE_FTP_BASE_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});