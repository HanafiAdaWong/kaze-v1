// Vercel Serverless Function — Proxy to Melolo API
// Forwards all /api/melolo/* requests to melolo-api-azure.vercel.app/api/melolo/*

export default async function handler(req, res) {
    try {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const pathname = urlObj.pathname; // e.g. "/api/melolo/latest"
        const targetPath = pathname.replace(/^\/api\/melolo/, ''); // e.g. "/latest"
        const queryString = urlObj.search || '';
        const targetUrl = `https://melolo-api-azure.vercel.app/api/melolo${targetPath}${queryString}`;

        const response = await fetch(targetUrl, {
            method: req.method || 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
        });

        const data = await response.text();

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

        return res.status(response.status).send(data);
    } catch (error) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(502).json({
            error: 'Proxy error',
            message: error.message,
        });
    }
}
