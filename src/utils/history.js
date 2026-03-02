/**
 * History Utility to manage watched anime in localStorage
 */

const HISTORY_KEY = 'kaze_watch_history';
const MAX_HISTORY = 50;

/**
 * Add an anime to history
 * @param {Object} animeData { animeId, title, episodeTitle, episodeId, poster, timestamp }
 */
export function addToHistory(animeData) {
    try {
        const history = getHistory();

        // Remove if already exists (to move to top)
        const filtered = history.filter(item => item.animeId !== animeData.animeId);

        // Add to beginning
        const updated = [
            {
                ...animeData,
                timestamp: Date.now()
            },
            ...filtered
        ].slice(0, MAX_HISTORY);

        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

        // Dispatch custom event so listeners know history updated
        window.dispatchEvent(new Event('historyChange'));
    } catch (e) {
        console.error('Failed to save history:', e);
    }
}

/**
 * Get all history items
 * @returns {Array} 
 */
export function getHistory() {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Failed to read history:', e);
        return [];
    }
}

/**
 * Clear all history
 */
export function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new Event('historyChange'));
}

/**
 * Remove single item from history
 */
export function removeFromHistory(animeId) {
    const history = getHistory();
    const updated = history.filter(item => item.animeId !== animeId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('historyChange'));
}
