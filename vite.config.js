import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// App version (from package.json) and build date, shown in the header
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))
const buildDate = new Date().toISOString().slice(0, 10)

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'C208B APE III',
        short_name: 'C208B APE III',
        description: 'C208B APE III performance',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#00457C',
        background_color: '#00457C',
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
