import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In development the API runs separately (npm run dev:api); forward /api
    // to it so the browser sees one origin, just like production on Vercel.
    proxy: {
      '/api': `http://localhost:${process.env.API_PORT ?? 3000}`,
    },
  },
})
