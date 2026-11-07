// Cloudflare Pages Function — Image Proxy for hotlink-protected sources

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    try {
        const targetUrl = url.searchParams.get('url');

        if (!targetUrl) {
            return new Response('Missing "url" parameter', { status: 400 });
        }

        const urlObj = new URL(targetUrl);
        const allowedHosts = ['anichin.moe', 'wp-content.anichin.moe'];
        const isAllowed = allowedHosts.some(host => urlObj.hostname === host || urlObj.hostname.endsWith('.' + host));

        if (!isAllowed) {
            return new Response('Host not allowed', { status: 403 });
        }

        const upstreamRes = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': `https://${urlObj.hostname}/`,
            },
        });

        if (!upstreamRes.ok) {
            return new Response(`Upstream returned ${upstreamRes.status}`, { status: upstreamRes.status });
        }

        const contentType = upstreamRes.headers.get('content-type') || 'image/webp';
        const buffer = await upstreamRes.arrayBuffer();

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
            },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Image proxy error', message: err.message }), {
            status: 502,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
