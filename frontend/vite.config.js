import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { cpSync, mkdirSync } from 'fs'

// Plugin: copy mathlive static assets (fonts + sounds) into the build output
// so /assets/fonts/*.woff2 and /assets/sounds/*.wav are always available.
function copyMathlivAssets() {
  return {
    name: 'copy-mathlive-assets',
    closeBundle() {
      const base = resolve(__dirname, 'node_modules/mathlive')
      const out = resolve(__dirname, 'dist')
      try {
        mkdirSync(`${out}/assets/fonts`, { recursive: true })
        mkdirSync(`${out}/assets/sounds`, { recursive: true })
        cpSync(`${base}/fonts`, `${out}/assets/fonts`, { recursive: true, force: true })
        cpSync(`${base}/sounds`, `${out}/assets/sounds`, { recursive: true, force: true })
      } catch (e) {
        console.warn('mathlive asset copy skipped:', e.message)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyMathlivAssets()],
  server: {
    host: 'localhost',
    port: 5175,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
