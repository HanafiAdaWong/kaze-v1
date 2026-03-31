import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Play, Clock, Inbox, ChevronRight } from 'lucide-react'
import { getHistory, clearHistory, removeFromHistory } from '../utils/history'

function History() {
    const [history, setHistory] = useState([])

    useEffect(() => {
        const loadHistory = () => {
            setHistory(getHistory())
        }

        loadHistory()

        // Listen for history changes from other components/utility
        window.addEventListener('historyChange', loadHistory)
        return () => window.removeEventListener('historyChange', loadHistory)
    }, [])

    const handleClearAll = () => {
        if (window.confirm('Hapus semua riwayat menonton?')) {
            clearHistory()
        }
    }

    const formatDate = (timestamp) => {
        const now = Date.now()
        const diff = now - timestamp

        if (diff < 60000) return 'Baru saja'
        if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`

        return new Date(timestamp).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div className="history-page" style={{ paddingTop: 'calc(var(--navbar-height) + 32px)', minHeight: '100vh' }}>
            <div className="container" style={{ paddingBottom: '80px' }}>
                <div className="watch-header" style={{ marginBottom: '40px' }}>
                    <h1 className="section-title" style={{ fontSize: '2.5rem', margin: 0 }}>
                        <Clock size={32} />
                        <span>Riwayat <span className="accent">Menonton</span></span>
                    </h1>

                    {history.length > 0 && (
                        <button
                            className="detail__btn detail__btn--secondary"
                            onClick={handleClearAll}
                            style={{ gap: '8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        >
                            <Trash2 size={16} /> Hapus Semua
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <div className="error-container" style={{ minHeight: '400px', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                        <div className="error-container__icon" style={{ opacity: 0.2 }}>
                            <Inbox size={80} />
                        </div>
                        <div className="error-container__title" style={{ fontSize: '1.5rem' }}>Belum ada riwayat</div>
                        <p className="error-container__message">Konten yang kamu tonton akan muncul di sini.</p>
                        <Link to="/" className="error-container__btn" style={{ marginTop: '16px' }}>
                            Mulai Menonton
                        </Link>
                    </div>
                ) : (
                    <div className="history-grid">
                        {history.map((item, i) => {
                            const getTypePath = (item, isEpisode = false) => {
                                const type = item.type || 'anime'; // fallback to anime
                                if (type === 'drachin') {
                                    return isEpisode ? `/drachin/${item.animeId}/episode/${item.episodeId}` : `/drachin/${item.animeId}`;
                                }
                                if (type === 'donghua') {
                                    return isEpisode ? `/donghua/episode/${item.episodeId}` : `/donghua/${item.animeId}`;
                                }
                                // anime
                                return isEpisode ? `/watch/${item.animeId}/episode/${item.episodeId}` : `/watch/${item.animeId}`;
                            };

                            return (
                                <div
                                    key={`${item.animeId}-${item.timestamp}`}
                                    className="history-item"
                                    style={{ animationDelay: `${i * 0.05}s` }}
                                >
                                    <Link to={getTypePath(item)} className="history-item__link">
                                        <div className="history-item__image">
                                            <img
                                                src={item.poster || 'https://ik.imagekit.io/lhtvft4ai/Logo%20kaze.png'}
                                                alt={item.title}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://ik.imagekit.io/lhtvft4ai/Logo%20kaze.png';
                                                }}
                                            />
                                            <div className="history-item__overlay">
                                                <Play size={32} fill="white" />
                                            </div>
                                        </div>
                                        <div className="history-item__content">
                                            <div className="history-item__meta">
                                                <span className="history-item__date">{formatDate(item.timestamp)}</span>
                                                {item.type && (
                                                    <span className="badge badge--accent" style={{ fontSize: '0.65rem', marginLeft: '8px' }}>
                                                        {item.type.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="history-item__title">{item.title}</h3>
                                            <p className="history-item__episode">
                                                Terakhir: <span className="accent">{item.episodeTitle}</span>
                                            </p>
                                            <div className="history-item__footer">
                                                <Link
                                                    to={getTypePath(item, true)}
                                                    className="history-item__play-btn"
                                                >
                                                    Lanjut Nonton <ChevronRight size={14} />
                                                </Link>
                                            </div>
                                        </div>
                                    </Link>
                                    <button
                                        className="history-item__remove"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            removeFromHistory(item.animeId);
                                        }}
                                        title="Hapus dari riwayat"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default History
