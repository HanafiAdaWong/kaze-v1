import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../services/watchlist';

function FavoriteButton({ anime }) {
    const { user, isAuthenticated } = useAuth();
    const [isFav, setIsFav] = useState(false);
    const [loading, setLoading] = useState(false);

    const animeId = anime.mal_id || anime.animeId;

    useEffect(() => {
        if (isAuthenticated && animeId) {
            isInWatchlist(user, animeId).then(setIsFav);
        }
    }, [isAuthenticated, animeId, user]);

    const toggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            alert('Silakan login untuk menambahkan ke daftar favorit!');
            return;
        }

        setLoading(true);
        if (isFav) {
            const { error } = await removeFromWatchlist(user, animeId);
            if (!error) setIsFav(false);
        } else {
            const { error } = await addToWatchlist(user, anime);
            if (!error) setIsFav(true);
        }
        setLoading(false);
    };

    return (
        <button
            onClick={toggleFavorite}
            disabled={loading}
            className={`detail__btn ${isFav ? 'detail__btn--primary' : 'detail__btn--secondary'}`}
            style={{ minWidth: 'auto', padding: '10px 14px' }}
            title={isFav ? 'Hapus dari List' : 'Tambah ke List'}
        >
            <Heart size={20} fill={isFav ? 'white' : 'transparent'} color={isFav ? 'white' : 'currentColor'} />
            <span style={{ marginLeft: '8px', display: 'inline' }}>
                {isFav ? 'Di List' : 'Simpan'}
            </span>
        </button>
    );
}

export default FavoriteButton;
