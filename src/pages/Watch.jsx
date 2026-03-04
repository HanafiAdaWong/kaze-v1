import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Play, TrendingUp, Clock, Flame } from 'lucide-react'
import { getWatchHome, searchWatchAnime } from '../services/api'
import Loader from '../components/Loader'

function WatchCard({ anime }) {
    return (
        <Link to={`/watch/${anime.animeId || anime.id || anime.slug}`} className="anime-card">
            <div className="anime-card__image-wrap">
                <img
                    className="anime-card__image"
                    src={anime.poster || anime.image || anime.img}
                    alt={anime.title}
                    loading="lazy"
                />
                {anime.score && (
                    <div className="anime-card__score">
                        ★ {anime.score}
                    </div>
                )}
                {anime.type && (
                    <div className="anime-card__type">{anime.type}</div>
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
                    {anime.status && <span>{anime.status}</span>}
                    {anime.episodes && (
                        <>
                            <span className="anime-card__meta-dot" />
                            <span>Ep {anime.episodes}</span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    )
}

function Watch() {
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
                const result = await searchWatchAnime(queryFromUrl)
                setSearchResults(result)
            } else {
                const data = await getWatchHome()
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
        <div style={{ paddingTop: 'calc(var(--navbar-height) + 32px)', minHeight: '100vh' }}>
            <div className="container">
                {/* Header */}
                <div className="watch-header">
                    <h1 className="section-title" style={{ fontSize: '2rem' }}>
                        <Play size={26} />
                        <span>Nonton <span className="accent">Anime</span></span>
                    </h1>
                    <form className="watch-search" onSubmit={handleSearch}>
                        <Search className="watch-search__icon" size={18} />
                        <input
                            type="text"
                            className="watch-search__input"
                            placeholder="Cari anime untuk ditonton..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="watch-search__btn">
                            Cari
                        </button>
                    </form>
                </div>

                {loading && <Loader text="Memuat anime..." />}

                {!loading && error && (
                    <div className="error-container">
                        <div className="error-container__title">Gagal memuat data</div>
                        <p className="error-container__message">{error}</p>
                        <button className="error-container__btn" onClick={fetchData}>Coba Lagi</button>
                    </div>
                )}

                {/* Search Results */}
                {!loading && !error && isSearchMode && searchResults && (
                    <div>
                        <h2 className="section-title">
                            Hasil pencarian: <span className="accent">"{queryFromUrl}"</span>
                        </h2>
                        {searchResults.animeList?.length > 0 ? (
                            <div className="anime-grid">
                                {searchResults.animeList.map((anime) => (
                                    <WatchCard key={anime.animeId} anime={anime} />
                                ))}
                            </div>
                        ) : (
                            <div className="error-container">
                                <div className="error-container__title">Tidak ditemukan</div>
                                <p className="error-container__message">Coba kata kunci lain.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Home Data */}
                {!loading && !error && !isSearchMode && homeData && (
                    <div>
                        {/* Recent Releases */}
                        {homeData.recent?.animeList?.length > 0 && (
                            <section className="watch-section">
                                <div className="watch-section__header">
                                    <h2 className="section-title">
                                        <Clock size={20} />
                                        <span>Baru <span className="accent">Rilis</span></span>
                                    </h2>
                                </div>
                                <div className="anime-grid">
                                    {homeData.recent.animeList?.slice(0, 12).map((anime) => (
                                        <WatchCard key={anime.animeId} anime={anime} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Popular */}
                        {homeData.popular?.animeList?.length > 0 && (
                            <section className="watch-section">
                                <div className="watch-section__header">
                                    <h2 className="section-title">
                                        <Flame size={20} />
                                        <span>Paling <span className="accent">Populer</span></span>
                                    </h2>
                                </div>
                                <div className="anime-grid">
                                    {homeData.popular.animeList?.slice(0, 12).map((anime) => (
                                        <WatchCard key={anime.animeId} anime={anime} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Ongoing */}
                        {homeData.ongoing?.animeList?.length > 0 && (
                            <section className="watch-section">
                                <div className="watch-section__header">
                                    <h2 className="section-title">
                                        <TrendingUp size={20} />
                                        <span>Sedang <span className="accent">Tayang</span></span>
                                    </h2>
                                </div>
                                <div className="anime-grid">
                                    {homeData.ongoing.animeList?.slice(0, 12).map((anime) => (
                                        <WatchCard key={anime.animeId} anime={anime} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* No Data Fallback */}
                        {!homeData.recent?.animeList?.length &&
                            !homeData.popular?.animeList?.length &&
                            !homeData.ongoing?.animeList?.length && (
                                <div className="error-container" style={{ minHeight: '300px' }}>
                                    <div className="error-container__title">Data tidak tersedia</div>
                                    <p className="error-container__message">Gagal mengambil daftar anime dari server streaming.</p>
                                    <form className="watch-search" onSubmit={handleSearch} style={{ marginTop: '20px', maxWidth: '400px', marginInline: 'auto' }}>
                                        <input
                                            type="text"
                                            className="watch-search__input"
                                            placeholder="Cari manual saja..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <button type="submit" className="watch-search__btn">Cari</button>
                                    </form>
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Watch
