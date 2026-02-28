import { supabase } from '../lib/supabase';

/**
 * Add an anime to the user's watchlist
 */
export async function addToWatchlist(user, anime) {
    if (!user) return { error: 'User not logged in' };

    const animeId = String(anime.mal_id || anime.animeId);

    const { data, error } = await supabase
        .from('watchlist')
        .insert([
            {
                user_id: user.id,
                anime_id: animeId,
                title: anime.title_english || anime.title || anime.titles?.[0]?.title,
                poster: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.poster,
                type: anime.type,
            }
        ]);

    return { data, error };
}

/**
 * Remove an anime from the user's watchlist
 */
export async function removeFromWatchlist(user, animeId) {
    if (!user) return { error: 'User not logged in' };

    const { data, error } = await supabase
        .from('watchlist')
        .delete()
        .match({ user_id: user.id, anime_id: String(animeId) });

    return { data, error };
}

/**
 * Get all anime in the user's watchlist
 */
export async function getWatchlist(user) {
    if (!user) return { data: [], error: 'User not logged in' };

    const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Check if an anime is already in the watchlist
 */
export async function isInWatchlist(user, animeId) {
    if (!user || !animeId) return false;

    const { data, error } = await supabase
        .from('watchlist')
        .select('id')
        .match({ user_id: user.id, anime_id: String(animeId) })
        .maybeSingle();

    if (error || !data) return false;
    return true;
}
