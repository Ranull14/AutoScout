import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In local dev, /api calls are proxied to the Vercel dev server.
      // Run `vercel dev` instead of `npm run dev` to test the /api/price route locally.
      // Without vercel dev, Option B will fail gracefully and fall back to Option A (MSRP conversion).
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
})
