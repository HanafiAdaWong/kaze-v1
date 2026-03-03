const JIKAN_BASE = 'https://api.jikan.moe/v4';

// ============================================
// CACHE SYSTEM — Simpan respons agar tidak request ulang
// ============================================

const cache = new Map();
const CACHE_TTL = {
    home: 5 * 60 * 1000,      // 5 menit untuk home
    search: 3 * 60 * 1000,    // 3 menit untuk search
    detail: 10 * 60 * 1000,   // 10 menit untuk detail anime
    episode: 10 * 60 * 1000,  // 10 menit untuk episode detail
    server: 5 * 60 * 1000,    // 5 menit untuk server URL
    jikan: 5 * 60 * 1000,     // 5 menit untuk Jikan
};

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key, data, ttl) {
    // Limit cache size to prevent memory leak
    if (cache.size > 200) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }
    cache.set(key, { data, timestamp: Date.now(), ttl });
}

// ============================================
// RATE LIMITER — Maksimal 50 req/menit ke Sanka
// (batas API 70, kita pakai 50 untuk aman)
// ============================================

const sankaRateLimiter = {
    requests: [],
    maxPerMinute: 50,
    queue: [],
    processing: false,

    canRequest() {
        const now = Date.now();
        // Hapus request yang sudah lebih dari 60 detik
        this.requests = this.requests.filter(t => now - t < 60000);
        return this.requests.length < this.maxPerMinute;
    },

    async waitForSlot() {
        while (!this.canRequest()) {
            // Tunggu sampai ada slot, cek setiap 500ms
            const oldest = this.requests[0];
            const waitTime = Math.max(100, 60000 - (Date.now() - oldest) + 100);
            await new Promise(r => setTimeout(r, Math.min(waitTime, 2000)));
        }
        this.requests.push(Date.now());
    },
};

// Dedupe: jangan request URL yang sama secara bersamaan
const pendingRequests = new Map();

// ============================================
// Generic fetch helpers
// ============================================

async function fetchWithTimeout(url, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return res;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error('Koneksi timeout. Coba lagi.');
        }
        throw err;
    }
}

async function fetchJikan(endpoint) {
    const cacheKey = `jikan:${endpoint}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const res = await fetchWithTimeout(`${JIKAN_BASE}${endpoint}`);
    if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1500));
        const retry = await fetchWithTimeout(`${JIKAN_BASE}${endpoint}`);
        if (!retry.ok) throw new Error(`API Error: ${retry.status}`);
        const json = await retry.json();
        setCache(cacheKey, json, CACHE_TTL.jikan);
        return json;
    }
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const json = await res.json();
    setCache(cacheKey, json, CACHE_TTL.jikan);
    return json;
}

async function fetchSanka(endpoint, cacheTtlKey = 'detail', source = 'samehadaku') {
    const baseUrl = `https://www.sankavollerei.com/anime/${source}`;
    const cacheKey = `sanka:${source}:${endpoint}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey);
    }

    const promise = (async () => {
        await sankaRateLimiter.waitForSlot();

        const res = await fetchWithTimeout(`${baseUrl}${endpoint}`, 20000);

        if (res.status === 429) {
            throw new Error('Rate limit tercapai. Tunggu sebentar lalu coba lagi.');
        }

        // We handle !res.ok carefully because we want the JSON error message if available
        if (!res.ok && res.status !== 404) {
            throw new Error(`Server streaming error: ${res.status}`);
        }

        const json = await res.json();

        // Handle 404 Not Found or "Success but actually an error" (e.g., 522 timeout)
        if (json.statusCode === 404 || (json.status === 'success' && json.data === null && !json.streams)) {
            if (json.error || (json.message && json.message.includes('Error fetching'))) {
                throw new Error(json.error || json.message || 'Server sumber sedang mengalami gangguan (Timeout).');
            }
            throw new Error('Data tidak ditemukan (404). Anime atau episode ini mungkin belum tersedia.');
        }

        if (json.status !== 'success') throw new Error(json.message || 'Gagal memuat data');

        // Cache results
        setCache(cacheKey, json, CACHE_TTL[cacheTtlKey] || CACHE_TTL.detail);
        return json;
    })();

    pendingRequests.set(cacheKey, promise);

    try {
        const result = await promise;
        return result;
    } finally {
        pendingRequests.delete(cacheKey);
    }
}

// ============================================
// Jikan API (MyAnimeList info)
// ============================================

export async function getAnimeById(id) {
    const json = await fetchJikan(`/anime/${id}`);
    return json.data;
}

export async function getTopAnime(page = 1, filter = '') {
    const params = new URLSearchParams({ page, limit: 24, sfw: true });
    if (filter) params.set('filter', filter);
    const json = await fetchJikan(`/top/anime?${params}`);

    // Fallback manual filter
    if (json.data) {
        json.data = json.data.filter(anime => {
            const genres = [...(anime.genres || []), ...(anime.explicit_genres || [])];
            return !genres.some(g => g.mal_id === 12 || g.mal_id === 49);
        });
    }

    return json;
}

export async function searchAnime(query, page = 1) {
    const params = new URLSearchParams({ q: query, page, limit: 24, sfw: true });
    const json = await fetchJikan(`/anime?${params}`);

    // Fallback manual filter
    if (json.data) {
        json.data = json.data.filter(anime => {
            const genres = [...(anime.genres || []), ...(anime.explicit_genres || [])];
            return !genres.some(g => g.mal_id === 12 || g.mal_id === 49);
        });
    }

    return json;
}

export async function getGenres() {
    const json = await fetchJikan('/genres/anime');
    if (json.data) {
        // Exclude adult genres (Hentai: 12, Erotica: 49)
        return json.data.filter(g => g.mal_id !== 12 && g.mal_id !== 49);
    }
    return [];
}

export async function getAnimeByGenre(genreId, page = 1) {
    const params = new URLSearchParams({
        genres: genreId,
        page,
        limit: 24,
        sfw: true,
        order_by: 'score',
        sort: 'desc'
    });
    const json = await fetchJikan(`/anime?${params}`);

    // Fallback manual filter
    if (json.data) {
        json.data = json.data.filter(anime => {
            const genres = [...(anime.genres || []), ...(anime.explicit_genres || [])];
            return !genres.some(g => g.mal_id === 12 || g.mal_id === 49);
        });
    }

    return json;
}

export async function getAnimeCharacters(id) {
    const json = await fetchJikan(`/anime/${id}/characters`);
    return json.data;
}

export async function getAnimeRecommendations(id) {
    const json = await fetchJikan(`/anime/${id}/recommendations`);
    // Recommendations usually return a different data structure, 
    // but often the entries are categorized as anime.
    // If we have access to genres in the entry, we should filter it.
    // However, MAL recommendations usually only return basic info.
    // We'll stick to Top/Search for major filtering as that's where adult titles are most prominent.
    return json.data;
}

// ============================================
// Sanka Vollerei API (Streaming / Watch)
// ============================================

/** Home page: recent + popular + ongoing */
export async function getWatchHome() {
    const json = await fetchSanka('/home', 'home');
    return json.data;
}

/** Popular anime list */
export async function getWatchPopular(page = 1) {
    const json = await fetchSanka(`/popular?page=${page}`, 'home');
    return json;
}

/** Search anime on Samehadaku */
export async function searchWatchAnime(query) {
    const json = await fetchSanka(`/search?q=${encodeURIComponent(query)}`, 'search');
    return json.data;
}

/** Get anime detail (episodes list) */
export async function getWatchAnimeDetail(animeId, page = 1) {
    const json = await fetchSanka(`/anime/${animeId}${page > 1 ? `?page=${page}` : ''}`, 'detail');
    return json;
}

/** Get episode detail (server list) */
export async function getEpisodeDetail(episodeId) {
    const json = await fetchSanka(`/episode/${episodeId}`, 'episode');
    return json.data;
}

/** [BYPASS] Get episode from Zoronime specifically */
export async function getZoronimeEpisodeDetail(slug) {
    const json = await fetchSanka(`/episode/${slug}`, 'episode', 'zoronime');
    return json;
}

/** [BYPASS] Get episode from Animasu specifically */
export async function getAnimasuEpisodeDetail(slug) {
    const json = await fetchSanka(`/episode/${slug}`, 'episode', 'animasu');
    // Animasu structure has streams at top level, not inside data
    return json;
}

/** [BYPASS] Get episode from Anoboy specifically */
export async function getAnoboyEpisodeDetail(slug) {
    const json = await fetchSanka(`/episode/${slug}`, 'episode', 'anoboy');
    return json;
}

/** Get streaming URL from server */
export async function getServerUrl(serverId) {
    const json = await fetchSanka(`/server/${serverId}`, 'server');
    return json.data;
}
