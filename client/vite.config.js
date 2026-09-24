import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['huge-hands-fetch.loca.lt'],
    hmr: {
      host: 'huge-hands-fetch.loca.lt',
      protocol: 'wss',
      clientPort: 443,
    },
  },
})
