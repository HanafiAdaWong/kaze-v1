import { supabase } from '../lib/supabase';

/**
 * Get comments for a specific anime or episode
 * @param {string} animeId - The ID of the anime or episode
 */
/**
 * Get comments for a specific anime or episode
 */
export async function getComments(animeId) {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('anime_id', String(animeId))
        .is('parent_id', null) // Only get top-level comments
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Get replies for a specific comment
 */
export async function getReplies(commentId) {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('parent_id', commentId)
        .order('created_at', { ascending: true });

    return { data, error };
}

/**
 * Post a new comment or reply
 */
export async function postComment(user, animeId, content, parentId = null) {
    if (!user) return { error: 'You must be logged in to comment' };

    const username = user.user_metadata?.username || user.email.split('@')[0];
    const avatarUrl = user.user_metadata?.avatar_url || '';

    const { data, error } = await supabase
        .from('comments')
        .insert([
            {
                user_id: user.id,
                username: username,
                avatar_url: avatarUrl,
                anime_id: String(animeId),
                content: content,
                parent_id: parentId
            }
        ])
        .select();

    return { data, error };
}

/**
 * Get user profile info from their comments
 */
export async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('comments')
        .select('username, avatar_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) return { error };
    return { data: data?.[0] || null };
}

/**
 * Get all comments by a specific user
 */
export async function getUserComments(userId) {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

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
