// Vercel Serverless Function — Image Proxy for hotlink-protected sources (like anichin.moe)

export default async function handler(req, res) {
    try {
        const { searchParams } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const targetUrl = searchParams.get('url');

        if (!targetUrl) {
            return res.status(400).send('Missing "url" parameter');
        }

        const urlObj = new URL(targetUrl);
        const allowedHosts = ['anichin.moe', 'wp-content.anichin.moe'];
        const isAllowed = allowedHosts.some(host => urlObj.hostname === host || urlObj.hostname.endsWith('.' + host));

        if (!isAllowed) {
            return res.status(403).send('Host not allowed');
        }

        const upstreamRes = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': `https://${urlObj.hostname}/`,
            },
        });

        if (!upstreamRes.ok) {
            return res.status(upstreamRes.status).send(`Upstream returned ${upstreamRes.status}`);
        }

        const contentType = upstreamRes.headers.get('content-type') || 'image/webp';
        const buffer = await upstreamRes.arrayBuffer();

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');

        return res.status(200).send(Buffer.from(buffer));
    } catch (err) {
        return res.status(502).json({ error: 'Image proxy error', message: err.message });
    }
}
