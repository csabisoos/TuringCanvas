import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Inject the service worker registration script into index.html automatically
      injectRegister: 'auto',
      // Cache the built assets using generateSW strategy (workbox handles everything)
      strategies: 'generateSW',
      workbox: {
        // Cache JS, CSS, HTML, SVG, and web fonts for full offline capability
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Ensure the SW takes control immediately without waiting for a reload
        clientsClaim: true,
        skipWaiting: true,
        // Runtime caching for any dynamic requests (belt-and-suspenders)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Web App Manifest
      manifest: {
        name: 'TuringCanvas - Automata Editor',
        short_name: 'TuringCanvas',
        description:
          'A modern, offline-capable PWA alternative to JFLAP for visualizing and simulating formal languages and finite automata.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'landscape',
        scope: '/',
        start_url: '/',
        // Icons are defined here as placeholders; drop real .png files into /public/icons/
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
