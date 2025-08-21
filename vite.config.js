import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path'; // 👉 เพิ่มบรรทัดนี้

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Get API URL from environment variable or default to localhost
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000';

  return {
    plugins: [react(), tailwindcss()],
    base: '/',
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            charts: ['recharts'],
            ui: ['@material-tailwind/react', '@heroicons/react'],
            icons: ['@mui/icons-material'],
            motion: ['framer-motion'],
            router: ['react-router-dom'],
            pdf: ['jspdf', 'html2canvas'],
            qr: ['react-qr-code']
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // 👉 เพิ่ม alias
      },
    },
    server: {
      allowedHosts: [
        'localhost',
        '9661019a77ca.ngrok-free.app',
      ],
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
