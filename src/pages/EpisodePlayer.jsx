import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, ChevronLeft, ChevronRight, Play, Monitor, Maximize2, Lock, X
} from 'lucide-react'
import { getEpisodeDetail, getServerUrl } from '../services/api'
import Loader from '../components/Loader'
import Comments from '../components/Comments'

function EpisodePlayer() {
    const { animeId, episodeId } = useParams()
    const navigate = useNavigate()

    const [episode, setEpisode] = useState(null)
    const [activeServer, setActiveServer] = useState(null)
    const [streamUrl, setStreamUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [playerLoading, setPlayerLoading] = useState(false)
    const [error, setError] = useState(null)
    const [serverError, setServerError] = useState(null)
    const [showPaymentModal, setShowPaymentModal] = useState(false)

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
                const data = await getEpisodeDetail(episodeId)
                if (cancelled) return
                setEpisode(data)

                // Auto-load first available server
                if (data.defaultStreamingUrl) {
                    setStreamUrl(data.defaultStreamingUrl)
                    setActiveServer('default')
                } else if (data.server?.qualities?.length > 0) {
                    // Find first non-720p quality with servers
                    for (const q of data.server.qualities) {
                        if (q.title === '720p') continue
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

        // 720p Paywall check
        if (qualityTitle === '720p') {
            setShowPaymentModal(true)
            return
        }

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
        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
                <div className="error-container">
                    <div className="error-container__title">Gagal memuat episode</div>
                    <p className="error-container__message">{error || 'Episode tidak ditemukan.'}</p>
                    <button className="error-container__btn" onClick={() => navigate(`/watch/${animeId}`)}>
                        Kembali ke Anime
                    </button>
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

                    {serverError && (
                        <p style={{ color: 'var(--warning)', fontSize: '0.85rem', marginBottom: '12px' }}>
                            ⚠️ {serverError}
                        </p>
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
                                {q.title} {q.title === '720p' && <Lock size={12} style={{ marginLeft: '4px', color: 'var(--warning)' }} />}
                            </div>
                            <div className="server-quality__list">
                                {q.serverList.map((s) => (
                                    <button
                                        key={s.serverId}
                                        className={`server-btn ${activeServer === s.serverId ? 'server-btn--active' : ''} ${q.title === '720p' ? 'server-btn--locked' : ''}`}
                                        onClick={() => handleServerClick(s.serverId, q.title)}
                                        disabled={playerLoading && q.title !== '720p'}
                                    >
                                        {q.title === '720p' ? <Lock size={14} /> : <Play size={14} />} {s.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Episode Info */}
                {episode.synopsis?.paragraphs?.length > 0 && (
                    <div className="player-synopsis">
                        <h3 className="detail__section-title">Sinopsis</h3>
                        <p className="detail__synopsis">{episode.synopsis.paragraphs[0]}</p>
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

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowPaymentModal(false)}>
                            <X size={20} />
                        </button>
                        <div className="payment-modal">
                            <div className="payment-modal__icon">
                                <Lock size={40} className="warning-text" />
                            </div>
                            <h2 className="payment-modal__title">Akses <span className="accent">Premium</span> Terkunci</h2>
                            <p className="payment-modal__text">
                                Untuk menonton dengan resolusi <strong>720p</strong>, kamu harus melakukan aktivasi fitur kikir.
                            </p>
                            <div className="payment-card">
                                <div className="payment-card__row">
                                    <span>Nominal Transfer:</span>
                                    <strong className="accent">Rp. 10.000</strong>
                                </div>
                                <div className="payment-card__row">
                                    <span>Nomor DANA/Tujuan:</span>
                                    <strong style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>083829622892</strong>
                                </div>
                            </div>
                            <p className="payment-modal__note">
                                Sertakan email akun kamu di catatan transfer. Setelah transfer, hubungi admin untuk aktivasi instan.
                            </p>
                            <button className="payment-modal__btn" onClick={() => setShowPaymentModal(false)}>
                                Saya Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default EpisodePlayer

