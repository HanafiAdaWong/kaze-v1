import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Star, Calendar, Film, Clock, Tv } from 'lucide-react'
import { getWatchAnimeDetail } from '../services/api'
import Loader from '../components/Loader'
import FavoriteButton from '../components/FavoriteButton'
import { translate } from '../utils/translator'

function WatchAnimeDetail() {
    const { animeId } = useParams()
    const navigate = useNavigate()
    const [anime, setAnime] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [translatedSynopsis, setTranslatedSynopsis] = useState('')
    const [translating, setTranslating] = useState(false)

    useEffect(() => {
        let cancelled = false
        async function fetchData() {
            setLoading(true)
            setError(null)
            try {
                const data = await getWatchAnimeDetail(animeId)
                if (!cancelled) {
                    setAnime(data)
                    if (data.synopsis?.paragraphs?.[0]) {
                        setTranslating(true)
                        translate(data.synopsis.paragraphs[0]).then(t => {
                            if (!cancelled) {
                                setTranslatedSynopsis(t)
                                setTranslating(false)
                            }
                        })
                    }
                }
            } catch (err) {
                if (!cancelled) setError(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        fetchData()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return () => { cancelled = true }
    }, [animeId])

    if (loading) {
        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader text="Memuat detail anime..." />
            </div>
        )
    }

    if (error || !anime) {
        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
                <div className="error-container">
                    <div className="error-container__title">Gagal memuat anime</div>
                    <p className="error-container__message">{error || 'Data tidak ditemukan.'}</p>
                    <button className="error-container__btn" onClick={() => navigate('/watch')}>Kembali</button>
                </div>
            </div>
        )
    }

    const title = anime.english || anime.synonyms || anime.title || animeId
    const totalEpisodes = anime.episodes || anime.episodeList?.length || '?'
    const episodeList = anime.episodeList || []

    return (
        <div className="detail" style={{ paddingTop: 'var(--navbar-height)' }}>
            {/* Hero */}
            <div className="watch-detail-hero">
                <div className="watch-detail-hero__bg">
                    <img src={anime.poster} alt="" />
                    <div className="watch-detail-hero__overlay" />
                </div>
                <div className="container">
                    <div className="watch-detail-hero__content">
                        <div className="watch-detail-hero__poster">
                            <img src={anime.poster} alt={title} />
                        </div>
                        <div className="watch-detail-hero__info">
                            <button
                                onClick={() => navigate(-1)}
                                className="watch-back-btn"
                            >
                                <ArrowLeft size={16} /> Kembali
                            </button>

                            <div className="detail__badges">
                                {anime.type && <span className="badge badge--accent">{anime.type}</span>}
                                {anime.status && (
                                    <span className={`badge ${anime.status === 'Ongoing' ? 'badge--success' : 'badge--info'}`}>
                                        {anime.status}
                                    </span>
                                )}
                                {anime.season && <span className="badge badge--warning">{anime.season}</span>}
                            </div>

                            <h1 className="detail__title">{title}</h1>
                            {anime.japanese && <p className="detail__title-jp">{anime.japanese}</p>}

                            <div className="watch-detail-meta">
                                {anime.score?.value && (
                                    <div className="watch-detail-meta__item">
                                        <Star size={16} className="watch-detail-meta__icon--score" />
                                        <span>{anime.score.value}</span>
                                    </div>
                                )}
                                <div className="watch-detail-meta__item">
                                    <Film size={16} />
                                    <span>{totalEpisodes} Episode</span>
                                </div>
                                {anime.duration && (
                                    <div className="watch-detail-meta__item">
                                        <Clock size={16} />
                                        <span>{anime.duration} min</span>
                                    </div>
                                )}
                                {anime.source && (
                                    <div className="watch-detail-meta__item">
                                        <Tv size={16} />
                                        <span>{anime.source}</span>
                                    </div>
                                )}
                            </div>

                            {anime.synopsis?.paragraphs?.length > 0 && (
                                <p className="watch-detail-synopsis">
                                    {translating ? 'Menterjemahkan sinopsis...' : (translatedSynopsis || anime.synopsis.paragraphs[0])}
                                </p>
                            )}

                            {anime.genreList?.length > 0 && (
                                <div className="detail__genres" style={{ marginTop: '16px' }}>
                                    {anime.genreList.map(g => (
                                        <span key={g.genreId} className="badge badge--accent">{g.title}</span>
                                    ))}
                                </div>
                            )}

                            {/* Quick play first episode */}
                            {episodeList.length > 0 && (
                                <Link
                                    to={`/watch/${animeId}/episode/${episodeList[episodeList.length - 1].episodeId}`}
                                    className="detail__btn detail__btn--primary"
                                    style={{ marginTop: '20px', display: 'inline-flex' }}
                                >
                                    <Play size={16} /> Tonton Episode 1
                                </Link>
                            )}
                            <div style={{ marginTop: '16px' }}>
                                <FavoriteButton anime={anime} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Episodes List */}
            <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
                <h2 className="section-title">
                    <Play size={20} />
                    <span>Daftar <span className="accent">Episode</span></span>
                </h2>

                {episodeList.length === 0 ? (
                    <div className="error-container" style={{ minHeight: '200px' }}>
                        <div className="error-container__title">Belum ada episode</div>
                        <p className="error-container__message">Episode belum tersedia untuk anime ini.</p>
                    </div>
                ) : (
                    <div className="episode-grid">
                        {[...episodeList].reverse().map((ep, i) => (
                            <Link
                                key={ep.episodeId}
                                to={`/watch/${animeId}/episode/${ep.episodeId}`}
                                className="episode-card"
                                style={{ animationDelay: `${Math.min(i, 20) * 0.03}s` }}
                            >
                                <div className="episode-card__number">
                                    <Play size={14} />
                                </div>
                                <div className="episode-card__info">
                                    <span className="episode-card__title">Episode {ep.title}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Additional Info */}
                <div className="watch-info-cards">
                    {anime.studios && (
                        <div className="detail__sidebar-card">
                            <h3>Studios</h3>
                            <p className="detail__info-value">{anime.studios}</p>
                        </div>
                    )}
                    {anime.producers && (
                        <div className="detail__sidebar-card">
                            <h3>Producers</h3>
                            <p className="detail__info-value">{anime.producers}</p>
                        </div>
                    )}
                    {anime.aired && (
                        <div className="detail__sidebar-card">
                            <h3>Aired</h3>
                            <p className="detail__info-value">{anime.aired}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default WatchAnimeDetail
