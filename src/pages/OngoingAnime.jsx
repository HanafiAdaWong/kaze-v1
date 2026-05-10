import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Play, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { getOngoingAnime } from '../services/api'
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
                {anime.episodes && (
                    <div className="anime-card__type">Ep {anime.episodes}</div>
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
                    {anime.releaseDay && <span>{anime.releaseDay}</span>}
                    {anime.latestReleaseDate && (
                        <>
                            <span className="anime-card__meta-dot" />
                            <span>{anime.latestReleaseDate}</span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    )
}

function OngoingAnime() {
    const [ongoingData, setOngoingData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [page, setPage] = useState(1)

    const fetchData = useCallback(async (p) => {
        setLoading(true)
        setError(null)
        try {
            const result = await getOngoingAnime(p)
            setOngoingData(result)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [page, fetchData])

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1)
    }

    const handleNextPage = () => {
        if (ongoingData?.pagination?.hasNextPage) {
            setPage(prev => prev + 1)
        }
    }

    return (
        <div style={{ paddingTop: 'calc(var(--navbar-height) + 32px)', minHeight: '100vh' }}>
            <div className="container">
                <div className="watch-header" style={{ marginBottom: '32px' }}>
                    <h1 className="section-title" style={{ fontSize: '2rem' }}>
                        <TrendingUp size={26} />
                        <span>Anime <span className="accent">Ongoing</span></span>
                    </h1>
                </div>

                {loading && <Loader text="Memuat anime ongoing..." />}

                {!loading && error && (
                    <div className="error-container">
                        <div className="error-container__title">Gagal memuat data</div>
                        <p className="error-container__message">{error}</p>
                        <button className="error-container__btn" onClick={() => fetchData(page)}>Coba Lagi</button>
                    </div>
                )}

                {!loading && !error && ongoingData && (
                    <div>
                        <div className="anime-grid">
                            {ongoingData.data?.animeList?.map((anime) => (
                                <WatchCard key={anime.animeId} anime={anime} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {ongoingData.pagination && (
                            <div className="pagination">
                                <button
                                    className="pagination__btn"
                                    onClick={handlePrevPage}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft size={20} />
                                    <span>Sebelumnya</span>
                                </button>
                                <span className="pagination__info">
                                    Halaman <span className="accent">{page}</span> dari {ongoingData.pagination.totalPages}
                                </span>
                                <button
                                    className="pagination__btn"
                                    onClick={handleNextPage}
                                    disabled={!ongoingData.pagination.hasNextPage}
                                >
                                    <span>Selanjutnya</span>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default OngoingAnime
