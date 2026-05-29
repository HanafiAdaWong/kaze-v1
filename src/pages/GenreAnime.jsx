import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Play, Tags, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { getWatchAnimeByGenre } from '../services/api'
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
                    {anime.studios && <span>{anime.studios}</span>}
                    {anime.season && (
                        <>
                            <span className="anime-card__meta-dot" />
                            <span>{anime.season}</span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    )
}

function GenreAnime() {
    const { genreId } = useParams()
    const [searchParams] = useSearchParams()
    const genreTitle = searchParams.get('title') || genreId.charAt(0).toUpperCase() + genreId.slice(1)
    
    const [genreData, setGenreData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [page, setPage] = useState(1)

    const fetchData = useCallback(async (gId, p) => {
        setLoading(true)
        setError(null)
        try {
            const result = await getWatchAnimeByGenre(gId, p)
            setGenreData(result)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData(genreId, page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [genreId, page, fetchData])

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1)
    }

    const handleNextPage = () => {
        if (genreData?.pagination?.hasNextPage) {
            setPage(prev => prev + 1)
        }
    }

    return (
        <div style={{ paddingTop: 'calc(var(--navbar-height) + 32px)', paddingBottom: '80px', minHeight: '100vh' }}>
            <div className="container">
                {/* Back to Genres Button */}
                <Link to="/genres" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} /> Kembali ke Daftar Genre
                </Link>

                <div className="watch-header" style={{ marginBottom: '32px' }}>
                    <h1 className="section-title" style={{ fontSize: '2rem' }}>
                        <Tags size={26} />
                        <span>Genre: <span className="accent">{genreTitle}</span></span>
                    </h1>
                </div>

                {loading && <Loader text={`Memuat anime genre ${genreTitle}...`} />}

                {!loading && error && (
                    <div className="error-container">
                        <div className="error-container__title">Gagal memuat data</div>
                        <p className="error-container__message">{error}</p>
                        <button className="error-container__btn" onClick={() => fetchData(genreId, page)}>Coba Lagi</button>
                    </div>
                )}

                {!loading && !error && genreData && (
                    <div>
                        {genreData.data?.animeList?.length === 0 ? (
                            <div className="genres-empty" style={{ minHeight: '30vh' }}>Tidak ada anime di genre ini.</div>
                        ) : (
                            <>
                                <div className="anime-grid">
                                    {genreData.data.animeList.map((anime) => (
                                        <WatchCard key={anime.animeId} anime={anime} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {genreData.pagination && (
                                    <div className="pagination" style={{ marginTop: '48px' }}>
                                        <button
                                            className="pagination__btn"
                                            onClick={handlePrevPage}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft size={20} />
                                            <span>Sebelumnya</span>
                                        </button>
                                        <span className="pagination__info">
                                            Halaman <span className="accent">{page}</span> dari {genreData.pagination.totalPages || 1}
                                        </span>
                                        <button
                                            className="pagination__btn"
                                            onClick={handleNextPage}
                                            disabled={!genreData.pagination.hasNextPage}
                                        >
                                            <span>Selanjutnya</span>
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default GenreAnime
