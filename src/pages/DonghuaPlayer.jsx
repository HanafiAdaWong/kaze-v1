import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, MonitorPlay } from 'lucide-react'
import { getDonghuaEpisode } from '../services/api'
import Loader from '../components/Loader'

function DonghuaPlayer() {
    const { episodeSlug } = useParams()
    const navigate = useNavigate()

    const [episodeData, setEpisodeData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Active server
    const [activeServer, setActiveServer] = useState(null)

    useEffect(() => {
        let cancelled = false
        async function fetchEp() {
            setLoading(true)
            setError(null)
            try {
                const json = await getDonghuaEpisode(episodeSlug)
                if (!cancelled) {
                    setEpisodeData(json)
                    // Set default server to main_url
                    if (json.streaming?.main_url?.url) {
                        setActiveServer(json.streaming.main_url)
                    } else if (json.streaming?.servers?.length > 0) {
                        setActiveServer(json.streaming.servers[0])
                    }
                }
            } catch (err) {
                if (!cancelled) setError(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        fetchEp()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return () => { cancelled = true }
    }, [episodeSlug])

    if (loading) {
        return (
            <div style={{ paddingTop: 'calc(var(--navbar-height) + 20px)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader text="Menyiapkan pemutar video..." />
            </div>
        )
    }

    if (error || !episodeData) {
        return (
            <div style={{ paddingTop: 'calc(var(--navbar-height) + 20px)', minHeight: '100vh' }}>
                <div className="error-container">
                    <div className="error-container__title">Video belum tersedia</div>
                    <p className="error-container__message">{error || 'Data episode ini tidak ditemukan.'}</p>
                    <button className="error-container__btn" onClick={() => navigate(-1)}>
                        Kembali
                    </button>
                </div>
            </div>
        )
    }

    const donghuaDetails = episodeData.donghua_details || {}
    const donghuaSlug = donghuaDetails.slug || ''
    const donghuaTitle = donghuaDetails.title || ''
    const episodeTitle = episodeData.episode || ''
    const servers = episodeData.streaming?.servers || []
    const episodesList = episodeData.episodes_list || []
    const nav = episodeData.navigation || {}

    // Reverse so ep 1 is first
    const sortedEpisodes = [...episodesList].reverse()

    // Extract episode number
    const getEpNumber = (epTitle) => {
        const match = epTitle.match(/episode\s*(\d+)/i)
        return match ? match[1] : epTitle
    }

    return (
        <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
            <div className="player-container">
                <div className="player-header">
                    <button onClick={() => navigate(`/donghua/${donghuaSlug}`)} className="watch-back-btn">
                        <ArrowLeft size={16} /> Kembali ke Info
                    </button>
                    <h1 className="player-title">
                        {donghuaTitle} - {getEpNumber(episodeTitle)}
                    </h1>
                </div>

                {/* Video Player (iframe) */}
                <div className="player-wrapper" style={{ position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9' }}>
                    {activeServer?.url ? (
                        <iframe
                            src={activeServer.url}
                            title={episodeTitle}
                            allowFullScreen
                            allow="autoplay; fullscreen; encrypted-media"
                            style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <p>Sumber video tidak ditemukan.</p>
                        </div>
                    )}
                </div>

                {/* Server Selection */}
                {servers.length > 0 && (
                    <div className="player-controls">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <MonitorPlay size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Server:
                            </span>
                            {servers.map((srv, idx) => (
                                <button
                                    key={idx}
                                    className={`server-btn ${activeServer?.url === srv.url ? 'server-btn--active' : ''}`}
                                    onClick={() => setActiveServer(srv)}
                                >
                                    {srv.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Episode Navigation */}
                <div className="player-nav">
                    {nav.prev?.slug ? (
                        <Link to={`/donghua/episode/${nav.prev.slug}`} className="player-nav-btn">
                            <ArrowLeft size={16} /> Episode Sebelumnya
                        </Link>
                    ) : (
                        <button className="player-nav-btn" disabled style={{ opacity: 0.5 }}>
                            <ArrowLeft size={16} /> Episode Sebelumnya
                        </button>
                    )}

                    {nav.next?.slug ? (
                        <Link to={`/donghua/episode/${nav.next.slug}`} className="player-nav-btn player-nav-btn--next">
                            Episode Selanjutnya <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                        </Link>
                    ) : (
                        <button className="player-nav-btn player-nav-btn--next" disabled style={{ opacity: 0.5 }}>
                            Episode Selanjutnya <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                    )}
                </div>

                {/* Episode List */}
                {sortedEpisodes.length > 0 && (
                    <div style={{ marginTop: '40px' }}>
                        <h2 className="section-title">
                            <Play size={20} />
                            <span>Pilih <span className="accent">Episode</span></span>
                        </h2>
                        <div className="episode-grid">
                            {sortedEpisodes.map((ep) => (
                                <Link
                                    key={ep.slug}
                                    to={`/donghua/episode/${ep.slug}`}
                                    className={`episode-card ${ep.slug === episodeSlug ? 'episode-card--active' : ''}`}
                                >
                                    <div className="episode-card__number">
                                        <Play size={14} />
                                    </div>
                                    <div className="episode-card__info">
                                        <span className="episode-card__title">{getEpNumber(ep.episode)}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DonghuaPlayer
