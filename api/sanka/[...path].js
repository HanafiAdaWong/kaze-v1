// Vercel Serverless Function — Proxy to Sanka Vollerei API
// Catches all /api/sanka/* requests and forwards them to sankavollerei.com/anime/*

export default async function handler(req, res) {
    const { path } = req.query;
    const targetPath = Array.isArray(path) ? path.join('/') : path || '';
    const queryString = new URL(req.url, `http://${req.headers.host}`).search || '';
    const targetUrl = `https://www.sankavollerei.com/anime/${targetPath}${queryString}`;

    try {
        const response = await fetch(targetUrl, {
            method: req.method || 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
        });

        const data = await response.text();

        // Forward the status code and set CORS headers
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
