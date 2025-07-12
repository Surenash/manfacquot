import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API requests to the Django backend
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Assuming source files will be in a 'src' directory
    }
  },
  build: {
    // Output directory for build assets
    outDir: 'dist',
    // Generate a manifest file for Django integration if needed later
    manifest: true,
  },
})
