import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    Star, Play, ExternalLink, ArrowLeft, Clock, Film, Calendar,
    Users, Heart, BarChart3, Tv, BookOpen
} from 'lucide-react'
import { getAnimeById, getAnimeCharacters, getAnimeRecommendations, getWatchAnimeDetail } from '../services/api'
import AnimeCard from '../components/AnimeCard'
import Loader from '../components/Loader'
import FavoriteButton from '../components/FavoriteButton'
import Comments from '../components/Comments'
import { translate } from '../utils/translator'

function AnimeDetail() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [anime, setAnime] = useState(null)
    const [characters, setCharacters] = useState([])
    const [recommendations, setRecommendations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [translatedSynopsis, setTranslatedSynopsis] = useState('')
    const [translating, setTranslating] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function fetchAll() {
            setLoading(true)
            setError(null)
            try {
                const data = await getAnimeById(id)
                if (cancelled) return
                setAnime(data)

                // Start translation immediately
                if (data.synopsis) {
                    setTranslating(true)
                    translate(data.synopsis).then(t => {
                        if (!cancelled) {
                            setTranslatedSynopsis(t)
                            setTranslating(false)
                        }
                    })
                }

                // Fetch characters with a small delay to avoid rate limit
                setTimeout(async () => {
                    try {
                        const chars = await getAnimeCharacters(id)
                        if (!cancelled) setCharacters(chars?.slice(0, 12) || [])
                    } catch { }

                    // Fetch recommendations with another delay
                    setTimeout(async () => {
                        try {
                            const recs = await getAnimeRecommendations(id)
                            if (!cancelled) setRecommendations(recs?.slice(0, 6) || [])
                        } catch { }
                    }, 500)
                }, 500)
            } catch (err) {
                if (!cancelled) setError(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchAll()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return () => { cancelled = true }
    }, [id])

    if (loading) {
        return (
            <div className="detail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <Loader text="Memuat detail anime..." />
            </div>
        )
    }

    if (error || !anime) {
        return (
            <div className="detail">
                <div className="error-container" style={{ minHeight: '100vh' }}>
                    <div className="error-container__title">Gagal memuat anime</div>
                    <p className="error-container__message">{error || 'Anime tidak ditemukan.'}</p>
                    <button className="error-container__btn" onClick={() => navigate('/')}>
                        Ke Sinopsis
                    </button>
                </div>
            </div>
        )
    }

    const title = anime.title_english || anime.title || anime.titles?.[0]?.title || 'Unknown'
    const titleJp = anime.title_japanese || ''
    const imageUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || ''
    const bgImage = imageUrl

    const statusColor = anime.status === 'Currently Airing'
        ? 'badge--success'
        : anime.status === 'Not yet aired'
            ? 'badge--warning'
            : 'badge--info'

    return (
        <div className="detail">
            {/* Hero */}
            <div className="detail__hero">
                <div className="detail__hero-bg">
                    {bgImage && <img src={bgImage} alt="" />}
                    <div className="detail__hero-overlay" />
                </div>

                <div className="container">
                    <div className="detail__hero-content">
                        <div className="detail__poster">
                            <img src={imageUrl} alt={title} />
                        </div>

                        <div className="detail__main-info">
                            {/* Back button */}
                            <button
                                onClick={() => navigate(-1)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    fontSize: '0.85rem', color: 'var(--text-muted)',
                                    marginBottom: '16px', transition: 'var(--transition-fast)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                                <ArrowLeft size={16} /> Kembali
                            </button>

                            {/* Badges */}
                            <div className="detail__badges">
                                {anime.type && <span className="badge badge--accent">{anime.type}</span>}
                                {anime.status && <span className={`badge ${statusColor}`}>{anime.status}</span>}
                                {anime.rating && <span className="badge badge--info">{anime.rating}</span>}
                                {anime.season && anime.year && (
                                    <span className="badge badge--accent" style={{ textTransform: 'capitalize' }}>
                                        {anime.season} {anime.year}
                                    </span>
                                )}
                            </div>

                            <h1 className="detail__title">{title}</h1>
                            {titleJp && <p className="detail__title-jp">{titleJp}</p>}

                            {/* Stats */}
                            <div className="detail__stats">
                                {anime.score && (
                                    <div className="detail__stat">
                                        <div className="detail__stat-value detail__stat-value--score">
                                            ★ {anime.score}
                                        </div>
                                        <div className="detail__stat-label">
                                            {anime.scored_by ? `${(anime.scored_by / 1000).toFixed(0)}K pengguna` : 'Skor'}
                                        </div>
                                    </div>
                                )}
                                {anime.rank && (
                                    <div className="detail__stat">
                                        <div className="detail__stat-value">#{anime.rank}</div>
                                        <div className="detail__stat-label">Peringkat</div>
                                    </div>
                                )}
                                {anime.popularity && (
                                    <div className="detail__stat">
                                        <div className="detail__stat-value">#{anime.popularity}</div>
                                        <div className="detail__stat-label">Popularitas</div>
                                    </div>
                                )}
                                {anime.members && (
                                    <div className="detail__stat">
                                        <div className="detail__stat-value">{(anime.members / 1000).toFixed(0)}K</div>
                                        <div className="detail__stat-label">Anggota</div>
                                    </div>
                                )}
                                {anime.favorites && (
                                    <div className="detail__stat">
                                        <div className="detail__stat-value">{(anime.favorites / 1000).toFixed(1)}K</div>
                                        <div className="detail__stat-label">Favorit</div>
                                    </div>
                                )}
                            </div>

                            <div className="detail__actions">
                                <FavoriteButton anime={anime} />
                                {anime.url && (
                                    <a
                                        href={anime.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="detail__btn detail__btn--secondary"
                                    >
                                        <ExternalLink size={16} /> Halaman MAL
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="container">
                <div className="detail__body">
                    <div className="detail__grid">
                        {/* Left Column */}
                        <div>
                            {/* Synopsis */}
                            {anime.synopsis && (
                                <div className="detail__section">
                                    <h2 className="detail__section-title">
                                        <BookOpen size={18} /> Sinopsis (Indonesia)
                                    </h2>
                                    <p className="detail__synopsis">
                                        {translating ? 'Menterjemahkan sinopsis...' : (translatedSynopsis || anime.synopsis)}
                                    </p>

                                </div>
                            )}

                            {/* Trailer Embed */}
                            {anime.trailer?.embed_url && (
                                <div className="detail__section">
                                    <h2 className="detail__section-title">
                                        <Play size={18} /> Trailer
                                    </h2>
                                    <div className="detail__trailer">
                                        <iframe
                                            src={anime.trailer.embed_url.replace('autoplay=1', 'autoplay=0')}
                                            title="Trailer"
                                            allowFullScreen
                                            allow="encrypted-media"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Characters */}
                            {characters.length > 0 && (
                                <div className="detail__section">
                                    <h2 className="detail__section-title">
                                        <Users size={18} /> Karakter
                                    </h2>
                                    <div className="characters-grid">
                                        {characters.map((c, i) => (
                                            <div
                                                key={c.character?.mal_id || i}
                                                className="character-card"
                                                style={{ animationDelay: `${i * 0.05}s` }}
                                            >
                                                <img
                                                    className="character-card__image"
                                                    src={c.character?.images?.webp?.image_url || c.character?.images?.jpg?.image_url}
                                                    alt={c.character?.name}
                                                    loading="lazy"
                                                />
                                                <div className="character-card__name">{c.character?.name}</div>
                                                <div className="character-card__role">{c.role}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {recommendations.length > 0 && (
                                <div className="detail__section">
                                    <h2 className="section-title">
                                        Kamu Mungkin <span className="accent">Suka</span>
                                    </h2>
                                    <div className="anime-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                                        {recommendations.map((rec, i) => (
                                            <AnimeCard
                                                key={rec.entry?.mal_id || i}
                                                anime={rec.entry}
                                                index={i}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Comments */}
                            <div className="detail__section">
                                <Comments animeId={id} />
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <div>
                            {/* Info Card */}
                            <div className="detail__sidebar-card">
                                <h3>Informasi</h3>
                                <div className="detail__info-row">
                                    <span className="detail__info-label">Tipe</span>
                                    <span className="detail__info-value">{anime.type || '—'}</span>
                                </div>
                                <div className="detail__info-row">
                                    <span className="detail__info-label">Episode</span>
                                    <span className="detail__info-value">{anime.episodes ?? '—'}</span>
                                </div>
                                <div className="detail__info-row">
                                    <span className="detail__info-label">Status</span>
                                    <span className="detail__info-value">{anime.status || '—'}</span>
                                </div>
                                <div className="detail__info-row">
                                    <span className="detail__info-label">Tayang</span>
                                    <span className="detail__info-value">{anime.aired?.prop?.string || '—'}</span>
                                </div>
                                <div className="detail__info-row">
                                    <span className="detail__info-label">Durasi</span>
                                    <span className="detail__info-value">{anime.duration || '—'}</span>
                                </div>
                                <div className="detail__info-row">
                                    <span className="detail__info-label">Rating</span>
                                    <span className="detail__info-value">{anime.rating || '—'}</span>
                                </div>
                                <div className="detail__info-row">
                                    <span className="detail__info-label">Sumber</span>
                                    <span className="detail__info-value">{anime.source || '—'}</span>
                                </div>
                                {anime.broadcast?.string && (
                                    <div className="detail__info-row">
                                        <span className="detail__info-label">Jadwal Tayang</span>
                                        <span className="detail__info-value">{anime.broadcast.string}</span>
                                    </div>
                                )}
                            </div>

                            {/* Genres */}
                            {(anime.genres?.length > 0 || anime.themes?.length > 0) && (
                                <div className="detail__sidebar-card">
                                    <h3>Genre & Tema</h3>
                                    <div className="detail__genres">
                                        {anime.genres?.map((g) => (
                                            <span key={g.mal_id} className="badge badge--accent">{g.name}</span>
                                        ))}
                                        {anime.themes?.map((t) => (
                                            <span key={t.mal_id} className="badge badge--info">{t.name}</span>
                                        ))}
                                        {anime.demographics?.map((d) => (
                                            <span key={d.mal_id} className="badge badge--warning">{d.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Studios & Producers */}
                            {(anime.studios?.length > 0 || anime.producers?.length > 0) && (
                                <div className="detail__sidebar-card">
                                    <h3>Produksi</h3>
                                    {anime.studios?.length > 0 && (
                                        <>
                                            <div className="detail__info-label" style={{ marginBottom: '8px', fontSize: '0.8rem' }}>Studios</div>
                                            <div className="detail__genres" style={{ marginBottom: '12px' }}>
                                                {anime.studios.map((s) => (
                                                    <span key={s.mal_id} className="badge badge--accent">{s.name}</span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {anime.producers?.length > 0 && (
                                        <>
                                            <div className="detail__info-label" style={{ marginBottom: '8px', fontSize: '0.8rem' }}>Producers</div>
                                            <div className="detail__genres">
                                                {anime.producers.map((p) => (
                                                    <span key={p.mal_id} className="badge badge--info">{p.name}</span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Licensors */}
                            {anime.licensors?.length > 0 && (
                                <div className="detail__sidebar-card">
                                    <h3>Lisensi</h3>
                                    <div className="detail__genres">
                                        {anime.licensors.map((l) => (
                                            <span key={l.mal_id} className="badge badge--warning">{l.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AnimeDetail
// update
