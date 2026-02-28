import { supabase } from '../lib/supabase';

/**
 * Get comments for a specific anime or episode
 * @param {string} animeId - The ID of the anime or episode
 */
export async function getComments(animeId) {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('anime_id', String(animeId))
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Post a new comment
 */
export async function postComment(user, animeId, content) {
    if (!user) return { error: 'You must be logged in to comment' };

    const username = user.user_metadata?.username || user.email.split('@')[0];

    const { data, error } = await supabase
        .from('comments')
        .insert([
            {
                user_id: user.id,
                username: username,
                anime_id: String(animeId),
                content: content,
            }
        ]);

    return { data, error };
}

/**
 * Delete a comment (only by the author)
 */
export async function deleteComment(user, commentId) {
    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
        .from('comments')
        .delete()
        .match({ id: commentId, user_id: user.id });

    return { data, error };
}
