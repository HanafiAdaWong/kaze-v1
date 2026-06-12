import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, TrendingUp, CheckCircle, ChevronRight, Sparkles, Clapperboard, BookOpen, Clock, Search } from 'lucide-react'
import { getWatchHome, getDonghuaHome } from '../services/api'
import Loader from '../components/Loader'
import OngoingAnimeSlider from '../components/OngoingAnimeSlider'
import HeroBanner from '../components/HeroBanner'

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

function DonghuaHomeCard({ donghua }) {
    // Slug usually has a trailing slash from the API
    const cleanSlug = donghua.slug.replace(/\/$/, '')
    return (
        <Link to={`/donghua/episode/${cleanSlug}`} className="main-home-card">
            <div className="main-home-card__image-wrap">
                <img
                    src={donghua.poster}
                    alt={donghua.title}
                    loading="lazy"
                    className="main-home-card__image"
                />
                <div className="main-home-card__overlay">
                    <Play size={20} fill="currentColor" />
                </div>
                <div className="main-home-card__badge main-home-card__badge--ep">
                    {donghua.current_episode || donghua.type}
                </div>
            </div>
            <div className="main-home-card__info">
                <p className="main-home-card__title">{donghua.title}</p>
                <p className="main-home-card__sub">{donghua.status}</p>
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
    const [donghuaData, setDonghuaData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        async function fetchHome() {
            try {
                setLoading(true)
                const [animeRes, donghuaRes] = await Promise.all([
                    getWatchHome(),
                    getDonghuaHome(1).catch(() => null) // Fallback if donghua fails
                ])
                setHomeData(animeRes)
                setDonghuaData(donghuaRes)
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
            navigate(`/watch?q=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    return (
        <div className="main-home">
            {/* === HERO === */}
            <section className="main-home-hero">
                <HeroBanner />
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
                    <div className="main-home-hero__links" style={{ marginBottom: '40px' }}>
                        <Link to="/watch" className="main-home-hero__link main-home-hero__link--primary">
                            <Play size={16} fill="currentColor" /> Nonton Anime
                        </Link>
                        <Link to="/ongoing" className="main-home-hero__link">
                            <TrendingUp size={16} /> Anime Ongoing
                        </Link>
                        <Link to="/donghua" className="main-home-hero__link">
                            <Clapperboard size={16} /> Donghua
                        </Link>
                    </div>

                    {/* Ongoing Anime Slider */}
                    {!loading && homeData?.ongoing?.animeList?.length > 0 && (
                        <div className="hero__slider-wrap" style={{ marginTop: '20px' }}>
                            <h3 className="section-subtitle" style={{ marginBottom: '16px', fontSize: '0.9rem', opacity: 0.8, textAlign: 'left' }}>
                                🔥 Sedang Tayang & Baru Update
                            </h3>
                            <OngoingAnimeSlider animes={homeData.ongoing.animeList} />
                        </div>
                    )}
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

                        {/* Donghua Terbaru */}
                        {donghuaData && donghuaData.latest_release?.length > 0 && (
                            <section className="main-home-section">
                                <SectionHeader
                                    icon={Clapperboard}
                                    title="Donghua"
                                    accent="Terbaru"
                                    to="/donghua"
                                />
                                <div className="main-home-grid">
                                    {donghuaData.latest_release.slice(0, 12).map((item, index) => (
                                        <DonghuaHomeCard key={item.slug || index} donghua={item} />
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
