import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, MonitorPlay, ChevronLeft, ChevronRight, Maximize2, Monitor, RefreshCw } from 'lucide-react'
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
    const [autoplay, setAutoplay] = useState(() => {
        const saved = localStorage.getItem('autoplay_donghua')
        return saved !== null ? JSON.parse(saved) : true
    })

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

    const handleFullscreen = () => {
        const iframe = document.getElementById('player-iframe')
        if (iframe) {
            if (iframe.requestFullscreen) iframe.requestFullscreen()
            else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen()
        }
    }

    const toggleAutoplay = () => {
        setAutoplay(prev => {
            const newValue = !prev
            localStorage.setItem('autoplay_donghua', JSON.stringify(newValue))
            return newValue
        })
    }

    if (loading) {
        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader text="Menyiapkan pemutar video..." />
            </div>
        )
    }

    if (error || !episodeData) {
        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
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
        <div className="player-page">
            <div className="container">
                <div className="player-header">
                    <Link to={`/donghua/${donghuaSlug}`} className="watch-back-btn">
                        <ArrowLeft size={16} /> Kembali ke Info
                    </Link>
                    <h1 className="player-title">
                        {donghuaTitle} - {getEpNumber(episodeTitle)}
                    </h1>
                </div>

                <div className="player-wrapper">
                    <div className="player-container">
                        {activeServer?.url ? (
                            <iframe
                                id="player-iframe"
                                src={activeServer.url}
                                title={episodeTitle}
                                allowFullScreen
                                allow="autoplay; fullscreen; encrypted-media"
                                className="player-iframe"
                            />
                        ) : (
                            <div className="player-placeholder">
                                <p>Sumber video tidak ditemukan.</p>
                            </div>
                        )}
                    </div>

                    <div className="player-controls">
                        <div className="player-controls__nav">
                            {nav.prev?.slug && (
                                <Link to={`/donghua/episode/${nav.prev.slug}`} className="player-nav-btn">
                                    <ChevronLeft size={16} /> Sebelumnya
                                </Link>
                            )}
                            {nav.next?.slug && (
                                <Link to={`/donghua/episode/${nav.next.slug}`} className="player-nav-btn">
                                    Selanjutnya <ChevronRight size={16} />
                                </Link>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                className={`player-nav-btn ${autoplay ? 'player-nav-btn--active' : ''}`} 
                                onClick={toggleAutoplay}
                                title={autoplay ? 'Autoplay Aktif' : 'Autoplay Nonaktif'}
                            >
                                <RefreshCw size={16} className={autoplay ? 'spin-slow' : ''} />
                                <span className="hide-mobile">Autoplay: {autoplay ? 'ON' : 'OFF'}</span>
                            </button>
                            <button className="player-nav-btn" onClick={handleFullscreen}>
                                <Maximize2 size={16} /> <span className="hide-mobile">Layar Penuh</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="server-section">
                    <h3 className="server-section__title">
                        <MonitorPlay size={18} /> Pilih Server
                    </h3>
                    <div className="server-quality">
                        <div className="server-quality__list">
                            {servers.map((srv, idx) => (
                                <button
                                    key={idx}
                                    className={`server-btn ${activeServer?.url === srv.url ? 'server-btn--active' : ''}`}
                                    onClick={() => setActiveServer(srv)}
                                >
                                    <Play size={14} /> {srv.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

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
