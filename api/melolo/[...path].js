// Vercel Serverless Function — Proxy to Melolo API
// Catches all /api/melolo/* requests and forwards them

export default async function handler(req, res) {
    const { path } = req.query;
    const targetPath = Array.isArray(path) ? path.join('/') : path || '';
    const queryString = new URL(req.url, `http://${req.headers.host}`).search || '';
    const targetUrl = `https://melolo-api-azure.vercel.app/api/melolo/${targetPath}${queryString}`;

    try {
        const response = await fetch(targetUrl, {
            method: req.method || 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
        });

        const data = await response.text();

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
