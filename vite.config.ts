import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { werewolfRoomServerPlugin } from './src/server/roomServerPlugin.ts'

const basePath = process.env.BASE_PATH || (process.env.GITHUB_ACTIONS ? '/masoi-online/' : '/ma-soi-offline/');

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [
    werewolfRoomServerPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'og-image.jpg', 'og-image.png'],
      manifest: {
        name: 'Ma Sói Online & Offline',
        short_name: 'Ma Sói',
        description: 'Chơi Ma Sói Online realtime nhiều người hoặc Trợ lý Quản trò Offline bằng bộ bài Tú lơ khơ',
        theme_color: '#090a10',
        background_color: '#090a10',
        display: 'standalone',
        start_url: basePath,
        scope: basePath,
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
  },
})
