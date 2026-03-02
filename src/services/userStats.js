import { supabase } from '../lib/supabase';

/**
 * Get user stats (xp and level)
 */
export async function getUserStats(userId) {
    if (!userId) return { error: 'User ID is required' };

    const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

    // If no stats yet, create them
    if (error && error.code === 'PGRST116') {
        const { data: newData, error: newError } = await supabase
            .from('user_stats')
            .insert([{ user_id: userId, xp: 0 }])
            .select()
            .single();

        if (newError) return { error: newError };
        return { data: formatStats(newData), error: null };
    }

    if (error) return { error };
    return { data: formatStats(data), error: null };
}

/**
 * Add XP to a user
 */
export async function addXP(userId, amount = 10) {
    if (!userId) return { error: 'User ID is required' };

    // Use absolute increments to avoid race conditions if possible
    // Here we'll just do a select-update loop for simplicity in this project
    const { data: currentStats, error: getError } = await getUserStats(userId);
    if (getError) return { error: getError };

    const newXP = (currentStats.xp || 0) + amount;

    const { data, error } = await supabase
        .from('user_stats')
        .update({ xp: newXP })
        .eq('user_id', userId)
        .select()
        .single();

    if (error) return { error };
    return { data: formatStats(data), error: null };
}

/**
 * Utility to calculate level from XP
 */
export function calculateLevel(xp) {
    // Formula: Level = floor(sqrt(xp / 100)) + 1
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;

    // Calculate progress to next level
    const currentLevelXP = Math.pow(level - 1, 2) * 100;
    const nextLevelXP = Math.pow(level, 2) * 100;

    const progress = (xp - currentLevelXP) / (nextLevelXP - currentLevelXP) * 100;

    return {
        level,
        xp,
        nextLevelXP,
        currentLevelXP,
        progress: Math.min(Math.max(progress, 0), 100)
    };
}

function formatStats(data) {
    if (!data) return null;
    return {
        ...data,
        ...calculateLevel(data.xp || 0)
    };
}
