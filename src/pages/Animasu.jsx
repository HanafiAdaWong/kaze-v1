import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Tv, Play, TrendingUp, CheckCircle, Search } from 'lucide-react'
import { getAnimasuHome, searchAnimasu } from '../services/api'
import Loader from '../components/Loader'

function AnimasuCard({ anime }) {
    const cleanSlug = anime.slug.replace(/\/$/, '')
    return (
        <Link to={`/animasu/${cleanSlug}`} className="anime-card">
            <div className="anime-card__image-wrap">
                <img
                    className="anime-card__image"
                    src={anime.poster}
                    alt={anime.title}
                    loading="lazy"
                />
                {anime.episode && (
                    <div className="anime-card__type">{anime.episode}</div>
                )}
                <div className="anime-card__overlay">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)' }}>
                        <Play size={16} fill="currentColor" /> Tonton
                    </div>
                </div>
            </div>
            <div className="anime-card__info">
                <h3 className="anime-card__title">{anime.title}</h3>
                <div className="anime-card__meta">
                    {anime.type && <span>{anime.type}</span>}
                    {anime.status_or_day && (
                        <>
                            <span className="anime-card__meta-dot" />
                            <span>{anime.status_or_day}</span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    )
}

function Animasu() {
    const [searchParams, setSearchParams] = useSearchParams()
    const queryFromUrl = searchParams.get('q') || ''

    const [homeData, setHomeData] = useState(null)
    const [searchResults, setSearchResults] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState(queryFromUrl)

    const isSearchMode = !!queryFromUrl

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            if (queryFromUrl) {
                const result = await searchAnimasu(queryFromUrl)
                setSearchResults(result.animes || [])
            } else {
                const data = await getAnimasuHome()
                setHomeData(data)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [queryFromUrl])

    useEffect(() => {
        fetchData()
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [fetchData])

    const handleSearch = (e) => {
        e.preventDefault()
        const trimmed = searchQuery.trim()
        if (trimmed) {
            setSearchParams({ q: trimmed })
        } else {
            setSearchParams({})
        }
    }

    return (
        <div style={{ paddingTop: 'calc(var(--navbar-height) + 32px)', minHeight: '100vh', paddingBottom: '80px' }}>
            <div className="container">
                {/* Header */}
                <div className="watch-header">
                    <h1 className="section-title" style={{ fontSize: '2rem' }}>
                        <Tv size={26} />
                        <span>Nonton <span className="accent">Animasu</span></span>
                    </h1>
                    
                    <form className="watch-search" onSubmit={handleSearch}>
                        <Search size={18} className="watch-search-icon" />
                        <input
                            type="text"
                            placeholder="Cari di Animasu..."
                            className="watch-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>

                {loading && <Loader text={isSearchMode ? `Mencari "${queryFromUrl}"...` : "Memuat Animasu..."} />}

                {!loading && error && (
                    <div className="error-container">
                        <div className="error-container__title">Gagal memuat data</div>
                        <p className="error-container__message">{error}</p>
                        <button className="error-container__btn" onClick={fetchData}>Coba Lagi</button>
                    </div>
                )}

                {!loading && !error && (
                    <div>
                        {isSearchMode ? (
                            <div>
                                <h2 className="section-title" style={{ marginBottom: '24px' }}>
                                    <Search size={20} />
                                    <span>Hasil Pencarian: <span className="accent">"{queryFromUrl}"</span></span>
                                </h2>
                                {!searchResults || searchResults.length === 0 ? (
                                    <div className="genres-empty" style={{ minHeight: '30vh' }}>Anime tidak ditemukan.</div>
                                ) : (
                                    <div className="anime-grid">
                                        {searchResults.map((anime) => (
                                            <AnimasuCard key={anime.slug} anime={anime} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            homeData && (
                                <>
                                    {/* Ongoing */}
                                    {homeData.ongoing?.length > 0 && (
                                        <section className="main-home-section">
                                            <div className="main-home-section-header">
                                                <h2 className="section-title" style={{ marginBottom: 0 }}>
                                                    <TrendingUp size={20} />
                                                    <span>Sedang <span className="accent">Tayang</span></span>
                                                </h2>
                                            </div>
                                            <div className="anime-grid">
                                                {homeData.ongoing.map((anime) => (
                                                    <AnimasuCard key={anime.slug} anime={anime} />
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Recent / Selesai */}
                                    {homeData.recent?.length > 0 && (
                                        <section className="main-home-section" style={{ marginTop: '48px' }}>
                                            <div className="main-home-section-header">
                                                <h2 className="section-title" style={{ marginBottom: 0 }}>
                                                    <CheckCircle size={20} />
                                                    <span>Baru <span className="accent">Diupdate</span></span>
                                                </h2>
                                            </div>
                                            <div className="anime-grid">
                                                {homeData.recent.map((anime) => (
                                                    <AnimasuCard key={anime.slug} anime={anime} />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Animasu
