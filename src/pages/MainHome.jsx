import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, TrendingUp, CheckCircle, ChevronRight, Sparkles, Clapperboard, BookOpen, Clock, Search } from 'lucide-react'
import { getWatchHome } from '../services/api'
import Loader from '../components/Loader'

function AnimeCard({ anime, showScore = false }) {
    return (
        <Link to={`/watch/${anime.animeId}`} className="main-home-card">
            <div className="main-home-card__image-wrap">
                <img
                    src={anime.poster}
                    alt={anime.title}
                    loading="lazy"
                    className="main-home-card__image"
                />
                <div className="main-home-card__overlay">
                    <Play size={20} fill="currentColor" />
                </div>
                {showScore && anime.score && (
                    <div className="main-home-card__badge main-home-card__badge--score">
                        ★ {anime.score}
                    </div>
                )}
                {!showScore && anime.episodes && (
                    <div className="main-home-card__badge main-home-card__badge--ep">
                        Ep {anime.episodes}
                    </div>
                )}
            </div>
            <div className="main-home-card__info">
                <p className="main-home-card__title">{anime.title}</p>
                <p className="main-home-card__sub">
                    {showScore
                        ? (anime.lastReleaseDate || '')
                        : (anime.releaseDay || '')}
                </p>
            </div>
        </Link>
    )
}

function SectionHeader({ icon: Icon, title, accent, to }) {
    return (
        <div className="main-home-section-header">
            <h2 className="section-title" style={{ marginBottom: 0 }}>
                <Icon size={20} />
                <span>{title} <span className="accent">{accent}</span></span>
            </h2>
            <Link to={to} className="view-all">
                Lihat Semua <ChevronRight size={16} />
            </Link>
        </div>
    )
}

function MainHome() {
    const [homeData, setHomeData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        async function fetchHome() {
            try {
                setLoading(true)
                const data = await getWatchHome()
                setHomeData(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchHome()
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            window.location.href = `/watch?q=${encodeURIComponent(searchQuery.trim())}`
        }
    }

    return (
        <div className="main-home">
            {/* === HERO === */}
            <section className="main-home-hero">
                <div className="main-home-hero__bg" />
                <div className="container main-home-hero__content">
                    <div className="main-home-hero__tag">
                        <Sparkles size={14} />
                        Selamat datang di Kazedonime
                    </div>
                    <h1 className="main-home-hero__title">
                        Nonton Anime<br />
                        <span className="gradient-text">Sub Indo Gratis</span>
                    </h1>
                    <p className="main-home-hero__desc">
                        Temukan ribuan judul anime, streaming langsung, cek sinopsis, dan ikuti perkembangan anime terbaru.
                    </p>

                    <form className="main-home-hero__search" onSubmit={handleSearch}>
                        <Search size={18} className="main-home-hero__search-icon" />
                        <input
                            type="text"
                            className="main-home-hero__search-input"
                            placeholder="Cari anime untuk ditonton..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="main-home-hero__search-btn">
                            Cari
                        </button>
                    </form>

                    {/* Quick Links */}
                    <div className="main-home-hero__links">
                        <Link to="/watch" className="main-home-hero__link main-home-hero__link--primary">
                            <Play size={16} fill="currentColor" /> Nonton Anime
                        </Link>
                        <Link to="/ongoing" className="main-home-hero__link">
                            <TrendingUp size={16} /> Anime Ongoing
                        </Link>
                        <Link to="/donghua" className="main-home-hero__link">
                            <Clapperboard size={16} /> Donghua
                        </Link>
                        <Link to="/sinopsis" className="main-home-hero__link">
                            <BookOpen size={16} /> Sinopsis
                        </Link>
                    </div>
                </div>
            </section>

            {/* === CONTENT === */}
            <div className="container" style={{ paddingBottom: '80px' }}>
                {loading && <Loader text="Memuat konten..." />}

                {!loading && error && (
                    <div className="error-container">
                        <div className="error-container__title">Gagal memuat data</div>
                        <p className="error-container__message">{error}</p>
                    </div>
                )}

                {!loading && !error && homeData && (
                    <>
                        {/* Ongoing */}
                        {homeData.ongoing?.animeList?.length > 0 && (
                            <section className="main-home-section">
                                <SectionHeader
                                    icon={TrendingUp}
                                    title="Sedang"
                                    accent="Tayang"
                                    to="/ongoing"
                                />
                                <div className="main-home-grid">
                                    {homeData.ongoing.animeList.slice(0, 12).map(anime => (
                                        <AnimeCard key={anime.animeId} anime={anime} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Completed */}
                        {homeData.completed?.animeList?.length > 0 && (
                            <section className="main-home-section">
                                <SectionHeader
                                    icon={CheckCircle}
                                    title="Selesai"
                                    accent="Tayang"
                                    to="/watch"
                                />
                                <div className="main-home-grid">
                                    {homeData.completed.animeList.slice(0, 12).map(anime => (
                                        <AnimeCard key={anime.animeId} anime={anime} showScore />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Shortcut grid */}
                        <section className="main-home-shortcuts">
                            <h2 className="section-title">
                                <Sparkles size={18} />
                                <span>Jelajahi <span className="accent">Lebih Jauh</span></span>
                            </h2>
                            <div className="main-home-shortcut-grid">
                                <Link to="/watch" className="main-home-shortcut">
                                    <div className="main-home-shortcut__icon" style={{ background: 'linear-gradient(135deg, #e879f9, #a855f7)' }}>
                                        <Play size={24} fill="currentColor" />
                                    </div>
                                    <div>
                                        <div className="main-home-shortcut__title">Nonton Anime</div>
                                        <div className="main-home-shortcut__desc">Streaming Sub Indo</div>
                                    </div>
                                    <ChevronRight size={20} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                </Link>
                                <Link to="/ongoing" className="main-home-shortcut">
                                    <div className="main-home-shortcut__icon" style={{ background: 'linear-gradient(135deg, #38bdf8, #6366f1)' }}>
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <div className="main-home-shortcut__title">Anime Ongoing</div>
                                        <div className="main-home-shortcut__desc">Yang sedang tayang</div>
                                    </div>
                                    <ChevronRight size={20} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                </Link>
                                <Link to="/donghua" className="main-home-shortcut">
                                    <div className="main-home-shortcut__icon" style={{ background: 'linear-gradient(135deg, #fb923c, #f43f5e)' }}>
                                        <Clapperboard size={24} />
                                    </div>
                                    <div>
                                        <div className="main-home-shortcut__title">Donghua</div>
                                        <div className="main-home-shortcut__desc">Animasi China</div>
                                    </div>
                                    <ChevronRight size={20} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                </Link>
                                <Link to="/sinopsis" className="main-home-shortcut">
                                    <div className="main-home-shortcut__icon" style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}>
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <div className="main-home-shortcut__title">Sinopsis</div>
                                        <div className="main-home-shortcut__desc">Info & Rating Anime</div>
                                    </div>
                                    <ChevronRight size={20} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                </Link>
                                <Link to="/history" className="main-home-shortcut">
                                    <div className="main-home-shortcut__icon" style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)' }}>
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <div className="main-home-shortcut__title">History</div>
                                        <div className="main-home-shortcut__desc">Tontonan terakhir</div>
                                    </div>
                                    <ChevronRight size={20} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                </Link>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    )
}

export default MainHome
