import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the build works on GitHub Pages, Netlify, Vercel or any static host.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  build: {
    // Vendors in their own chunks: they load in parallel and stay cached across content edits.
    chunkSizeWarningLimit: 300,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/ },
            { name: 'gsap', test: /node_modules[\\/](gsap|lenis)[\\/]/ },
            { name: 'ui', test: /node_modules[\\/](@radix-ui|@floating-ui|lucide-react)[\\/]/ },
          ],
        },
      },
    },
  },
})
