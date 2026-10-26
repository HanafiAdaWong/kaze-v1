/**
 * Helper to ensure images with hotlink / anti-leech protection (like anichin.moe)
 * load properly through an internal proxy.
 */
export function getProxyImageUrl(url) {
    if (!url || typeof url !== 'string') return ''

    // If it's already a relative path or local data URL, return as-is
    if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
        return url
    }

    // Check if the domain blocks hotlinking (e.g. anichin.moe)
    try {
        const parsed = new URL(url)
        if (parsed.hostname.includes('anichin.moe')) {
            return `/api/image-proxy?url=${encodeURIComponent(url)}`
        }
    } catch {
        // invalid URL format, return raw
    }

    return url
}
