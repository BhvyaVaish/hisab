import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',

      // Precache everything the app needs to work offline
      workbox: {
        globPatterns: [
          '**/*.{html,js,css,svg,png,woff2,webmanifest}',
        ],
        // No runtime caching needed – all fonts are self-hosted via @fontsource
      },

      // Web App Manifest
      manifest: {
        name:             'Hisab',
        short_name:       'Hisab',
        description:      'Stock and reorder for kirana shops',
        display:          'standalone',
        start_url:        './',
        scope:            './',
        theme_color:      '#1E1E2E',
        background_color: '#FFF8E7',
        lang:             'hi',
        icons: [
          {
            src:     'icon-192.png',
            sizes:   '192x192',
            type:    'image/png',
            purpose: 'any maskable',
          },
          {
            src:     'icon-512.png',
            sizes:   '512x512',
            type:    'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
