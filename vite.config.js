import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' keeps asset paths relative so the app works under /<repo>/ on GitHub Pages
export default defineConfig({ base: './', plugins: [react(), tailwindcss()] })
