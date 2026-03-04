import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, ChevronLeft, ChevronRight, Play, Monitor, Maximize2
} from 'lucide-react'
import { getEpisodeDetail, getServerUrl, getWatchAnimeDetail, getAnimasuEpisodeDetail, getZoronimeEpisodeDetail, getAnoboyEpisodeDetail } from '../services/api'
import { addToHistory } from '../utils/history'
import Loader from '../components/Loader'
import Comments from '../components/Comments'
import { translate } from '../utils/translator'
import { useAuth } from '../contexts/AuthContext'
import { addXP } from '../services/userStats'

function EpisodePlayer() {
    const { animeId, episodeId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [episode, setEpisode] = useState(null)
    const [animeDetail, setAnimeDetail] = useState(null)
    const [activeServer, setActiveServer] = useState(null)
    const [streamUrl, setStreamUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [playerLoading, setPlayerLoading] = useState(false)
    const [error, setError] = useState(null)
    const [serverError, setServerError] = useState(null)
    const [translatedSynopsis, setTranslatedSynopsis] = useState('')
    const [translating, setTranslating] = useState(false)
    const [isBypass, setIsBypass] = useState(false)

    const handleBypass = async (source) => {
        setLoading(true)
        setError(null)
        setStreamUrl(null)
        setActiveServer(null)
        try {
            let data
            let bypassSlug = episodeId

            if (source === 'animasu' && !bypassSlug.startsWith('nonton-')) {
                bypassSlug = `nonton-${bypassSlug}`
            }

            if (source === 'anoboy') {
                // Anoboy often uses '...subtitle-indonesia' suffix
                if (!bypassSlug.includes('subtitle-indonesia')) {
                    bypassSlug = `${bypassSlug}-subtitle-indonesia`
                }
                data = await getAnoboyEpisodeDetail(bypassSlug)
            } else if (source === 'animasu') {
                data = await getAnimasuEpisodeDetail(bypassSlug)
            } else if (source === 'zoronime') {
                data = await getZoronimeEpisodeDetail(bypassSlug)
            }

            if (!data || (!data.streams && !data.data)) {
                throw new Error('Data tidak lengkap dari server ini.')
            }

            const finalData = data.data || data
            setEpisode({
                ...finalData,
                source: source.charAt(0).toUpperCase() + source.slice(1),
                title: finalData.title || episode?.title || `Episode ${episodeId}`
            })
            setIsBypass(true)

            // Auto-load first stream if available
            const streams = finalData.streams || []
            if (streams.length > 0) {
                setStreamUrl(streams[0].url)
                setActiveServer('bypass-0')
            }
        } catch (err) {
            setError(`Server ${source} gagal: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }


    // Fetch episode detail
    useEffect(() => {
        let cancelled = false
        async function fetchEpisode() {
            setLoading(true)
            setError(null)
            setStreamUrl(null)
            setActiveServer(null)
            setServerError(null)
            try {
                // Fetch both episode and anime detail (for history)
                const [data, detail] = await Promise.all([
                    getEpisodeDetail(episodeId),
                    getWatchAnimeDetail(animeId).catch(() => null)
                ])

                if (cancelled) return
                setEpisode(data)
                setAnimeDetail(detail)

                // Translate synopsis
                if (data.synopsis?.paragraphs?.[0]) {
                    setTranslating(true)
                    translate(data.synopsis.paragraphs[0]).then(t => {
                        if (!cancelled) {
                            setTranslatedSynopsis(t)
                            setTranslating(false)
                        }
                    })
                }

                // Save to history
                if (detail?.data) {
                    const anime = detail.data;
                    addToHistory({
                        animeId,
                        episodeId,
                        title: anime.english || anime.synonyms || anime.title || animeId,
                        episodeTitle: data.title || `Episode ${episodeId}`,
                        poster: anime.poster || anime.image || anime.img,
                        timestamp: Date.now()
                    })
                }

                // Add XP (10 points per episode watch)
                if (user) {
                    addXP(user.id, 10).catch(err => console.error('Error adding XP:', err));
                }

                // Auto-load first available server
                if (data.defaultStreamingUrl) {
                    setStreamUrl(data.defaultStreamingUrl)
                    setActiveServer('default')
                } else if (data.server?.qualities?.length > 0) {
                    // Find first quality with servers
                    for (const q of data.server.qualities) {
                        if (q.serverList?.length > 0) {
                            const first = q.serverList[0]
                            setActiveServer(first.serverId)
                            setPlayerLoading(true)
                            try {
                                const serverData = await getServerUrl(first.serverId)
                                if (!cancelled) {
                                    setStreamUrl(serverData.url)
                                }
                            } catch (err) {
                                if (!cancelled) {
                                    setServerError('Gagal memuat server. Coba pilih server lain.')
                                    console.error('Auto-load server failed:', err)
                                }
                            } finally {
                                if (!cancelled) setPlayerLoading(false)
                            }
                            break
                        }
                    }
                }
            } catch (err) {
                if (!cancelled) setError(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        fetchEpisode()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return () => { cancelled = true }
    }, [episodeId])

    const loadServer = async (serverId) => {
        setPlayerLoading(true)
        setServerError(null)
        try {
            const data = await getServerUrl(serverId)
            setStreamUrl(data.url)
            setActiveServer(serverId)
        } catch (err) {
            console.error('Failed to load server:', err)
            setServerError('Server gagal dimuat: ' + (err.message || 'Coba server lain.'))
        } finally {
            setPlayerLoading(false)
        }
    }

    const handleServerClick = async (serverId, qualityTitle) => {
        if (serverId === activeServer) return

        if (serverId === 'default' && episode?.defaultStreamingUrl) {
            setStreamUrl(episode.defaultStreamingUrl)
            setActiveServer('default')
            setServerError(null)
            return
        }
        await loadServer(serverId)
    }

    const handleFullscreen = () => {
        const iframe = document.getElementById('player-iframe')
        if (iframe) {
            if (iframe.requestFullscreen) iframe.requestFullscreen()
            else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen()
        }
    }

    if (loading) {
        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader text="Memuat episode..." />
            </div>
        )
    }

    if (error || !episode) {
        const is404 = error?.includes('404') || error?.includes('tidak ditemukan');

        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
                <div className="error-container">
                    <div className="error-container__title">Gagal memuat episode</div>
                    <p className="error-container__message">{error || 'Episode tidak ditemukan.'}</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="error-container__btn" onClick={() => navigate(`/watch/${animeId}`)}>
                            Kembali ke Daftar Episode
                        </button>
                        {is404 && (
                            <>
                                <button
                                    className="error-container__btn error-container__btn--secondary"
                                    onClick={() => navigate(`/watch?q=${encodeURIComponent(animeId.replace(/-/g, ' '))}`)}
                                >
                                    Cari Manual di Server
                                </button>
                                <button
                                    className="error-container__btn"
                                    style={{ background: 'var(--accent-primary)', border: 'none' }}
                                    onClick={() => handleBypass('animasu')}
                                >
                                    Gunakan Server Animasu
                                </button>
                                <button
                                    className="error-container__btn"
                                    style={{ background: '#3b82f6', border: 'none' }}
                                    onClick={() => handleBypass('zoronime')}
                                >
                                    Gunakan Server Zoronime
                                </button>
                                <button
                                    className="error-container__btn"
                                    style={{ background: '#f59e0b', border: 'none' }}
                                    onClick={() => handleBypass('anoboy')}
                                >
                                    Gunakan Server Anoboy
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const allQualities = episode.server?.qualities || []

    return (
        <div className="player-page">
            <div className="container">
                {/* Header */}
                <div className="player-header">
                    <Link to={`/watch/${animeId}`} className="watch-back-btn">
                        <ArrowLeft size={16} /> Kembali
                    </Link>
                    <h1 className="player-title">{episode.title}</h1>
                </div>

                {/* Video Player */}
                <div className="player-wrapper">
                    <div className="player-container">
                        {playerLoading && (
                            <div className="player-loading">
                                <Loader text="Memuat server..." />
                            </div>
                        )}
                        {!playerLoading && serverError && !streamUrl && (
                            <div className="player-placeholder">
                                <p style={{ color: 'var(--warning)', marginBottom: '12px' }}>{serverError}</p>
                                <button className="error-container__btn" onClick={() => activeServer && loadServer(activeServer)}>
                                    Coba Lagi
                                </button>
                            </div>
                        )}
                        {!playerLoading && streamUrl ? (
                            <iframe
                                id="player-iframe"
                                src={streamUrl}
                                title={episode.title}
                                allowFullScreen
                                allow="autoplay; encrypted-media; fullscreen"
                                className="player-iframe"
                            />
                        ) : !playerLoading && !serverError && (
                            <div className="player-placeholder">
                                <Play size={48} />
                                <p>Pilih server untuk mulai menonton</p>
                            </div>
                        )}
                    </div>

                    {/* Player Controls Bar */}
                    <div className="player-controls">
                        <div className="player-controls__nav">
                            {episode.hasPrevEpisode && episode.prevEpisode && (
                                <Link
                                    to={`/watch/${animeId}/episode/${episode.prevEpisode.episodeId}`}
                                    className="player-nav-btn"
                                >
                                    <ChevronLeft size={16} /> Sebelumnya
                                </Link>
                            )}
                            {episode.hasNextEpisode && episode.nextEpisode && (
                                <Link
                                    to={`/watch/${animeId}/episode/${episode.nextEpisode.episodeId}`}
                                    className="player-nav-btn"
                                >
                                    Selanjutnya <ChevronRight size={16} />
                                </Link>
                            )}
                        </div>
                        <button className="player-nav-btn" onClick={handleFullscreen}>
                            <Maximize2 size={16} /> Layar Penuh
                        </button>
                    </div>
                </div>

                {/* Server Selection */}
                <div className="server-section">
                    <h3 className="server-section__title">
                        <Monitor size={18} /> Pilih Server
                    </h3>

                    {/* Alternative Bypass Streams (Animasu style) */}
                    {episode.streams && episode.streams.length > 0 && (
                        <div className="server-quality">
                            <div className="server-quality__label">Alternatif ({episode.source || 'Bypass'})</div>
                            <div className="server-quality__list">
                                {episode.streams.map((stream, i) => (
                                    <button
                                        key={i}
                                        className={`server-btn ${activeServer === `bypass-${i}` ? 'server-btn--active' : ''}`}
                                        onClick={() => {
                                            setStreamUrl(stream.url)
                                            setActiveServer(`bypass-${i}`)
                                            setServerError(null)
                                        }}
                                        disabled={playerLoading}
                                    >
                                        {stream.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Default server */}
                    {episode.defaultStreamingUrl && (
                        <div className="server-quality">
                            <div className="server-quality__label">Default</div>
                            <div className="server-quality__list">
                                <button
                                    className={`server-btn ${activeServer === 'default' ? 'server-btn--active' : ''}`}
                                    onClick={() => handleServerClick('default', 'default')}
                                    disabled={playerLoading}
                                >
                                    <Play size={14} /> Player Default
                                </button>
                            </div>
                        </div>
                    )}

                    {allQualities.map((q) => (
                        <div key={q.title} className="server-quality">
                            <div className="server-quality__label">
                                {q.title}
                            </div>
                            <div className="server-quality__list">
                                {q.serverList.map((s) => (
                                    <button
                                        key={s.serverId}
                                        className={`server-btn ${activeServer === s.serverId ? 'server-btn--active' : ''}`}
                                        onClick={() => handleServerClick(s.serverId, q.title)}
                                        disabled={playerLoading}
                                    >
                                        <Play size={14} /> {s.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Episode Info */}
                {episode.synopsis?.paragraphs?.length > 0 && (
                    <div className="player-synopsis">
                        <h3 className="detail__section-title">Sinopsis (Indonesia)</h3>
                        <p className="detail__synopsis">
                            {translating ? 'Menterjemahkan sinopsis...' : (translatedSynopsis || episode.synopsis.paragraphs[0])}
                        </p>
                    </div>
                )}

                {/* Genre tags */}
                {episode.genreList?.length > 0 && (
                    <div className="detail__genres" style={{ marginBottom: '24px' }}>
                        {episode.genreList.map(g => (
                            <span key={g.genreId} className="badge badge--accent">{g.title}</span>
                        ))}
                    </div>
                )}

                {/* Comments */}
                <div style={{ marginTop: '40px' }}>
                    <Comments animeId={episodeId} />
                </div>
            </div>

        </div>
    )
}

export default EpisodePlayer

