import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: 'Kiko Coffee - Tarjeta de Lealtad',
        short_name: 'Kiko Coffee',
        description: 'Programa de lealtad para Kiko Coffee',
        theme_color: '#4A2C2A',
        background_color: '#FDF6EC',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
})
