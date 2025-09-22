import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    // Explicitly disable CSP and security headers
    headers: {
      'Content-Security-Policy': '',
      'X-Content-Type-Options': '',
      'X-Frame-Options': '',
      'Referrer-Policy': ''
    }
  },
  optimizeDeps: {
    exclude: []
  },
  test: { environment: 'jsdom', setupFiles: './src/setupTests.js' }
})
