/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  base: process.env.ELECTRON_BUILD === 'true' ? './' : '/',
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
      manifest: {
        name: 'HealthCore',
        short_name: 'HealthCore',
        description: 'Your personal health and fitness companion',
        theme_color: '#0f0f11',
        background_color: '#0f0f11',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    cssMinify: false,
    chunkSizeWarningLimit: 1600,
  },
  server: {
    host: true, // expose to local network for phone testing
    allowedHosts: true, // permite cualquier host (como localtunnel)
    proxy: {
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
