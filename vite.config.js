import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path'; // 👉 เพิ่มบรรทัดนี้

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // 👉 เพิ่ม alias
    },
  },
  server: {
    allowedHosts: [
      'localhost',
      '9661019a77ca.ngrok-free.app', // เพิ่ม host นี้เพื่อให้ ngrok เข้าถึงได้
    ],
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
