import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Fix Cross-Origin-Opener-Policy blocking Firebase Google Auth popup
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('firebase')) return 'firebase-vendor'
          if (id.includes('framer-motion')) return 'motion-vendor'
          if (id.includes('react-router-dom')) return 'router-vendor'
          if (id.includes('/react-dom/') || id.includes('/react/')) return 'react-vendor'
          return 'vendor'
        },
      },
    },
  },
})
