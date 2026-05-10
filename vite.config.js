import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api/sanka': {
        target: 'https://www.sankavollerei.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sanka/, '/anime'),
        secure: false,
      },
      '/api/melolo': {
        target: 'https://melolo-api-azure.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/melolo/, '/api/melolo'),
        secure: false,
        followRedirects: true,
      }
    }
  }
})
