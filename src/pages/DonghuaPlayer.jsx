import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Settings } from 'lucide-react'
import { getDonghuaEpisode } from '../services/api'
import Loader from '../components/Loader'

function DonghuaPlayer() {
    const { slug } = useParams()
    const navigate = useNavigate()

    const [episodeData, setEpisodeData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    // Server state
    const [servers, setServers] = useState([])
    const [currentServer, setCurrentServer] = useState(null)

    useEffect(() => {
        let suspended = false
        async function fetchEpisode() {
            setLoading(true)
            setError(null)
            try {
                const epData = await getDonghuaEpisode(slug)
                
                if (!suspended) {
                    setEpisodeData(epData)
                    
                    if (epData && epData.streams && epData.streams.length > 0) {
                        setServers(epData.streams)
                        setCurrentServer(epData.streams[0])
                    } else {
                        setServers([])
                        setCurrentServer(null)
                    }
                }
            } catch (err) {
                if (!suspended) setError(err.message)
            } finally {
                if (!suspended) setLoading(false)
            }
        }
        fetchEpisode()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return () => { suspended = true }
    }, [slug])

    if (loading) {
        return (
            <div style={{ paddingTop: 'calc(var(--navbar-height) + 20px)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader text="Menyiapkan pemutar donghua..." />
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

    const title = episodeData.title || 'Menonton Donghua'
    const nav = episodeData.navigation || {}
    const animeInfo = episodeData.anime_info || {}
    const related = episodeData.related_episodes || []

    return (
        <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
            <div className="player-container">
                <div className="player-header">
                    <button 
                        onClick={() => navigate(nav.all_slug ? `/donghua/${nav.all_slug}` : '/donghua')} 
                        className="watch-back-btn"
                    >
                        <ArrowLeft size={16} /> Kembali ke {animeInfo.title || 'Info'}
                    </button>
                    <h1 className="player-title">
                        {title}
                    </h1>
                </div>

                <div className="player-wrapper" style={{ position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9' }}>
                    {currentServer ? (
                        <iframe
                            src={currentServer.url}
                            title="Pemutar Video Donghua"
                            allowFullScreen
                            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        ></iframe>
                    ) : (
                        <div className="error-container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p>Sumber video tidak ditemukan.</p>
                        </div>
                    )}
                </div>

                <div className="player-controls">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <Settings size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Server:
                        </span>
                        {servers.map((server, idx) => (
                            <button
                                key={idx}
                                className={`server-btn ${currentServer === server ? 'server-btn--active' : ''}`}
                                onClick={() => setCurrentServer(server)}
                            >
                                {server.server}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="player-nav">
                    {nav.prev_slug ? (
                        <Link to={`/donghua/episode/${nav.prev_slug}`} className="player-nav-btn">
                            <ArrowLeft size={16} /> Episode Sebelumnya
                        </Link>
                    ) : (
                        <button className="player-nav-btn" disabled style={{ opacity: 0.5 }}>
                            <ArrowLeft size={16} /> Episode Sebelumnya
                        </button>
                    )}

                    {nav.next_slug ? (
                        <Link to={`/donghua/episode/${nav.next_slug}`} className="player-nav-btn player-nav-btn--next">
                            Episode Selanjutnya <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                        </Link>
                    ) : (
                        <button className="player-nav-btn player-nav-btn--next" disabled style={{ opacity: 0.5 }}>
                            Episode Selanjutnya <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                    )}
                </div>

                {related.length > 0 && (
                    <div style={{ marginTop: '40px', paddingBottom: '40px' }}>
                        <h2 className="section-title">
                            <Play size={20} />
                            <span>Episode <span className="accent">Lainnya</span></span>
                        </h2>
                        <div className="episode-grid">
                            {related.map((ep) => (
                                <Link
                                    key={ep.slug}
                                    to={`/donghua/episode/${ep.slug}`}
                                    className={`episode-card ${ep.slug === slug ? 'episode-card--active' : ''}`}
                                >
                                    <div className="episode-card__number">
                                        <Play size={14} />
                                    </div>
                                    <div className="episode-card__info">
                                        <span className="episode-card__title">{ep.title.replace(animeInfo.title || '', '').trim() || ep.title}</span>
                                        {ep.posted_date && <span className="episode-card__date" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ep.posted_date}</span>}
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
