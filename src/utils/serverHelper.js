/**
 * Helper to select the preferred server and quality.
 * Priority: 720p with server title matching 'mega'
 * If not found, falls back to 720p (any server), then mega (any quality),
 * or finally the first available server.
 */
export function findPreferredServer(qualities = []) {
    if (!qualities || qualities.length === 0) return null;

    // 1. Try to find 720p quality with a 'mega' server
    const q720 = qualities.find(q => /720/i.test(q.title || ''));
    if (q720 && q720.serverList?.length > 0) {
        const megaServer = q720.serverList.find(s => /mega/i.test(s.title || ''));
        if (megaServer) {
            return { quality: q720, server: megaServer };
        }
        // If no mega in 720p, return the first server in 720p
        return { quality: q720, server: q720.serverList[0] };
    }

    // 2. If 720p doesn't exist, search for 'mega' in any other quality
    for (const q of qualities) {
        if (q.serverList?.length > 0) {
            const megaServer = q.serverList.find(s => /mega/i.test(s.title || ''));
            if (megaServer) {
                return { quality: q, server: megaServer };
            }
        }
    }

    // 3. Fallback: first available server in the first quality
    for (const q of qualities) {
        if (q.serverList?.length > 0) {
            return { quality: q, server: q.serverList[0] };
        }
    }

    return null;
}
