import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getWatchlist, removeFromWatchlist } from '../services/watchlist';
import Loader from '../components/Loader';

function MyList() {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchWatchlist = async () => {
        setLoading(true);
        const { data, error } = await getWatchlist(user);
        if (error) {
            setError(error.message);
        } else {
            setWatchlist(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchWatchlist();
    }, [user]);

    const handleRemove = async (e, animeId) => {
        e.preventDefault();
        e.stopPropagation();

        if (window.confirm('Hapus anime ini dari daftar?')) {
            const { error } = await removeFromWatchlist(user, animeId);
            if (!error) {
                setWatchlist(prev => prev.filter(item => item.anime_id !== animeId));
            }
        }
    };

    return (
        <div style={{ paddingTop: 'calc(var(--navbar-height) + 40px)', minHeight: '100vh' }}>
            <div className="container">
                <h1 className="section-title">
                    <Heart size={26} fill="var(--accent-primary)" />
                    <span>Daftar <span className="accent">Tontonan</span></span>
                </h1>

                {loading && <Loader text="Memuat daftar anime kamu..." />}

                {!loading && error && (
                    <div className="error-container">
                        <div className="error-container__title">Oops! Terjadi kesalahan</div>
                        <p className="error-container__message">{error}</p>
                    </div>
                )}

                {!loading && watchlist.length === 0 && !error && (
                    <div className="error-container" style={{ minHeight: '400px' }}>
                        <div className="error-container__title">List kamu kosong</div>
                        <p className="error-container__message">Kamu belum menyimpan anime apapun. Ayo cari anime favoritmu!</p>
                        <Link to="/" className="error-container__btn">Jelajahi Anime</Link>
                    </div>
                )}

                {!loading && watchlist.length > 0 && (
                    <div className="anime-grid">
                        {watchlist.map((anime, i) => (
                            <Link to={`/anime/${anime.anime_id}`} key={anime.id} className="anime-card" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="anime-card__image-wrap">
                                    <img src={anime.poster} alt={anime.title} className="anime-card__image" />
                                    <div className="anime-card__type">{anime.type}</div>
                                    <div className="anime-card__overlay">
                                        <button
                                            onClick={(e) => handleRemove(e, anime.anime_id)}
                                            className="detail__btn detail__btn--secondary"
                                            style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444', color: '#ef4444', padding: '8px' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="anime-card__info">
                                    <h3 className="anime-card__title">{anime.title}</h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyList;
