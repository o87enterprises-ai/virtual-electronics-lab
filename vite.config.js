import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the built app works from any static host or
  // subpath (Cloudflare Pages, GitHub Pages, plain file hosting).
  base: './',
  plugins: [react()],
})
