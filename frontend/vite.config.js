import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Remove CSP headers in development to avoid conflicts
    // You can add them back for production builds
    port: 5173,
    host: true
  },
  build: {
    // Enable source maps for better debugging
    sourcemap: true
  }
})
