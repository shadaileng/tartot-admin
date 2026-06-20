import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/reading': 'http://localhost:3000',
      '/poster': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/metrics': 'http://localhost:3000',
      '/logs': 'http://localhost:3000',
      '/cards': 'http://localhost:3000',
    },
  },
})
