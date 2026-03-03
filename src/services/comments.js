import { supabase } from '../lib/supabase';

/**
 * Get comments for a specific anime or episode
 * @param {string} animeId - The ID of the anime or episode
 */
/**
 * Get comments for a specific anime or episode
 */
export async function getComments(animeId) {
    // Fetch comments first without problematic join
    const { data, error } = await supabase
        .from('comments')
        .select(`
            *,
            likes_count:comment_likes(count),
            reply_count:comments!parent_id(count)
        `)
        .eq('anime_id', String(animeId))
        .is('parent_id', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching comments:', error);
        return { data: [], error };
    }

    if (data && data.length > 0) {
        // Fetch XP for all users in these comments separately
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: statsData } = await supabase
            .from('user_stats')
            .select('user_id, xp')
            .in('user_id', userIds);

        const statsMap = {};
        statsData?.forEach(s => { statsMap[s.user_id] = s.xp; });

        data.forEach(c => {
            c.likes_count = c.likes_count?.[0]?.count || 0;
            c.reply_count = c.reply_count?.[0]?.count || 0;
            c.xp = statsMap[c.user_id] || 0;
        });
    }

    return { data: data || [], error: null };
}

export async function getReplies(commentId) {
    const { data, error } = await supabase
        .from('comments')
        .select(`
            *,
            likes_count:comment_likes(count),
            reply_count:comments!parent_id(count)
        `)
        .eq('parent_id', commentId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching replies:', error);
        return { data: [], error };
    }

    if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: statsData } = await supabase
            .from('user_stats')
            .select('user_id, xp')
            .in('user_id', userIds);

        const statsMap = {};
        statsData?.forEach(s => { statsMap[s.user_id] = s.xp; });

        data.forEach(c => {
            c.likes_count = c.likes_count?.[0]?.count || 0;
            c.reply_count = c.reply_count?.[0]?.count || 0;
            c.xp = statsMap[c.user_id] || 0;
        });
    }

    return { data: data || [], error: null };
}

/**
 * Post a new comment or reply
 */
export async function postComment(user, animeId, content, parentId = null, replyToUsername = null) {
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
                parent_id: parentId,
                reply_to_username: replyToUsername
            }
        ])
        .select();

    return { data, error };
}

/**
 * Toggle like for a comment
 */
export async function toggleLike(userId, commentId) {
    if (!userId) return { error: 'Unauthorized' };

    // Check if liked
    const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('*')
        .match({ comment_id: commentId, user_id: userId })
        .single();

    if (existingLike) {
        // Unlike
        const { error } = await supabase
            .from('comment_likes')
            .delete()
            .match({ comment_id: commentId, user_id: userId });
        return { liked: false, error };
    } else {
        // Like
        const { error } = await supabase
            .from('comment_likes')
            .insert([{ comment_id: commentId, user_id: userId }]);
        return { liked: true, error };
    }
}

/**
 * Check if a user liked a comment
 */
export async function checkUserLiked(userId, commentId) {
    if (!userId) return false;
    const { data } = await supabase
        .from('comment_likes')
        .select('*')
        .match({ comment_id: commentId, user_id: userId })
        .single();
    return !!data;
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
