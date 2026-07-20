import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/kanji-summer/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/kanji-summer/',
        name: '夏休み漢字たんけん',
        short_name: '漢字たんけん',
        description:
          '小学3年生・1学期の漢字を、夏休みに毎日5〜10分で復習できる学習アプリ。広告なし・課金なし・ログインなし。',
        lang: 'ja',
        start_url: '/kanji-summer/',
        scope: '/kanji-summer/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#eaf6ff',
        theme_color: '#0f6fb0',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: '/kanji-summer/index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['e2e/**', 'src/main.tsx', '**/*.config.*'],
    },
    exclude: ['e2e/**', 'node_modules/**'],
    // vite-plugin-pwa の仮想モジュールは production ビルド向けなので、
    // テスト実行時のみ無害なスタブに差し替える。
    alias: [{ find: 'virtual:pwa-register/react', replacement: '/src/test/pwaRegisterStub.ts' }],
  },
})
