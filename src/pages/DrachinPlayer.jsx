import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Settings } from 'lucide-react'
import { getDrachinEpisode, getDrachinDetail } from '../services/api'
import Loader from '../components/Loader'

function DrachinPlayer() {
    const { slug, index } = useParams()
    const navigate = useNavigate()

    const [episodeData, setEpisodeData] = useState(null)
    const [detail, setDetail] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    // Video quality state
    const [resolutions, setResolutions] = useState({})
    const [currentRes, setCurrentRes] = useState('')
    const videoRef = useRef(null)

    useEffect(() => {
        let suspended = false
        async function fetchAll() {
            setLoading(true)
            setError(null)
            try {
                // Fetch episode video info
                const epData = await getDrachinEpisode(slug, index)
                
                // Fetch detail to get episode list for navigation
                const detailData = await getDrachinDetail(slug)
                
                if (!suspended) {
                    setEpisodeData(epData)
                    setDetail(detailData)

                    if (epData && epData.videos) {
                        setResolutions(epData.videos)
                        // Auto-select highest available quality
                        const available = Object.keys(epData.videos)
                        if (available.length > 0) {
                            // Sort by number descending (1080p -> 720p -> 540p)
                            available.sort((a, b) => parseInt(b) - parseInt(a))
                            setCurrentRes(available[0])
                        }
                    }
                }
            } catch (err) {
                if (!suspended) setError(err.message)
            } finally {
                if (!suspended) setLoading(false)
            }
        }
        fetchAll()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return () => { suspended = true }
    }, [slug, index])

    // Remember video position when changing resolutions
    const handleResolutionChange = (res) => {
        if (!videoRef.current) return
        const currentTime = videoRef.current.currentTime
        const isPaused = videoRef.current.paused
        setCurrentRes(res)
        
        // Timeout to let React update the src
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.currentTime = currentTime
                if (!isPaused) {
                    videoRef.current.play().catch(e => console.log('Auto-play prevented:', e))
                }
            }
        }, 50)
    }

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

    const title = detail?.title || episodeData?.title || 'Drama China'
    const episodeList = detail?.episodes || []
    
    // Find prev and next episode based on current index
    const currentIndexNum = parseInt(index)
    
    // Because episodes array usually ordered linearly, let's find the current index in the array
    const currentIndexInArray = episodeList.findIndex(ep => ep.index === index || parseInt(ep.index) === currentIndexNum)
    let prevIndex = null
    let nextIndex = null
    
    if (currentIndexInArray > 0) {
        prevIndex = episodeList[currentIndexInArray - 1].index
    }
    if (currentIndexInArray !== -1 && currentIndexInArray < episodeList.length - 1) {
        nextIndex = episodeList[currentIndexInArray + 1].index
    }

    const videoSrc = resolutions[currentRes]

    return (
        <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
            <div className="player-container">
                <div className="player-header">
                    <button onClick={() => navigate(`/drachin/${slug}`)} className="watch-back-btn">
                        <ArrowLeft size={16} /> Kembali ke Info
                    </button>
                    <h1 className="player-title">
                        {title} - Ep {episodeData.episode || index}
                    </h1>
                </div>

                <div className="player-wrapper" style={{ position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9' }}>
                    {videoSrc ? (
                        <video
                            ref={videoRef}
                            src={videoSrc}
                            poster={episodeData.poster}
                            controls
                            autoPlay
                            playsInline
                            style={{ width: '100%', height: '100%', outline: 'none' }}
                        />
                    ) : (
                        <div className="error-container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p>Sumber video tidak ditemukan.</p>
                        </div>
                    )}
                </div>

                <div className="player-controls">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <Settings size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Kualitas:
                        </span>
                        {Object.keys(resolutions).map(res => (
                            <button
                                key={res}
                                className={`server-btn ${currentRes === res ? 'server-btn--active' : ''}`}
                                onClick={() => handleResolutionChange(res)}
                            >
                                {res}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="player-nav">
                    {prevIndex ? (
                        <Link to={`/drachin/${slug}/episode/${prevIndex}`} className="player-nav-btn">
                            <ArrowLeft size={16} /> Episode Sebelumnya
                        </Link>
                    ) : (
                        <button className="player-nav-btn" disabled style={{ opacity: 0.5 }}>
                            <ArrowLeft size={16} /> Episode Sebelumnya
                        </button>
                    )}

                    {nextIndex ? (
                        <Link to={`/drachin/${slug}/episode/${nextIndex}`} className="player-nav-btn player-nav-btn--next">
                            Episode Selanjutnya <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                        </Link>
                    ) : (
                        <button className="player-nav-btn player-nav-btn--next" disabled style={{ opacity: 0.5 }}>
                            Episode Selanjutnya <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                    )}
                </div>

                {episodeList.length > 0 && (
                    <div style={{ marginTop: '40px' }}>
                        <h2 className="section-title">
                            <Play size={20} />
                            <span>Pilih <span className="accent">Episode</span></span>
                        </h2>
                        <div className="episode-grid">
                            {episodeList.map((ep) => (
                                <Link
                                    key={ep.index}
                                    to={`/drachin/${slug}/episode/${ep.index}`}
                                    className={`episode-card ${ep.index === index || parseInt(ep.index) === currentIndexNum ? 'episode-card--active' : ''}`}
                                >
                                    <div className="episode-card__number">
                                        <Play size={14} />
                                    </div>
                                    <div className="episode-card__info">
                                        <span className="episode-card__title">{ep.episode}</span>
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

export default DrachinPlayer
