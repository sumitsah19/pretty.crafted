import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        // Split large vendor bundles so the initial HTML payload stays small
        // (smaller initial JS = faster LCP = better SEO ranking signal)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@sentry'))        return 'vendor-sentry'
            if (id.includes('react-helmet'))   return 'vendor-helmet'
            if (id.includes('@reduxjs') || id.includes('react-redux')) return 'vendor-redux'
            if (id.includes('posthog'))        return 'vendor-analytics'
            if (id.includes('axios'))          return 'vendor-http'
            if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/'))
                                               return 'vendor-react'
          }
        },
      },
    },
    // Inline small assets (< 4 kB) so they don't cause extra round-trips
    assetsInlineLimit: 4096,
  },

  test: {
    globals: true,
    environment: 'node',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/store/**', 'src/hooks/**', 'src/analytics.js'],
    },
  },
})
