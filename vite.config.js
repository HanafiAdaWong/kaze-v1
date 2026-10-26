import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const imageProxyPlugin = () => ({
  name: 'image-proxy',
  configureServer(server) {
    server.middlewares.use('/api/image-proxy', async (req, res) => {
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        const targetUrl = urlObj.searchParams.get('url');
        if (!targetUrl) {
          res.statusCode = 400;
          return res.end('Missing url');
        }

        const parsedTarget = new URL(targetUrl);
        const upstream = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': `https://${parsedTarget.hostname}/`
          }
        });

        if (!upstream.ok) {
          res.statusCode = upstream.status;
          return res.end(`Upstream error: ${upstream.status}`);
        }

        const contentType = upstream.headers.get('content-type') || 'image/webp';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');

        const arrayBuffer = await upstream.arrayBuffer();
        res.end(Buffer.from(arrayBuffer));
      } catch (err) {
        res.statusCode = 500;
        res.end(err.message);
      }
    });
  }
});

export default defineConfig({
  plugins: [react(), imageProxyPlugin()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api/sanka': {
        target: 'https://www.sankavollerei.web.id',
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

