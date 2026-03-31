import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Settings, ChevronLeft, ChevronRight, Maximize2, Monitor, RefreshCw } from 'lucide-react'
import { getDrachinEpisode, getDrachinDetail } from '../services/api'
import { addToHistory } from '../utils/history'
import { useAuth } from '../contexts/AuthContext'
import { addXP } from '../services/userStats'
import Loader from '../components/Loader'

function DrachinPlayer() {
    const { slug, index } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [episodeData, setEpisodeData] = useState(null)
    const [detail, setDetail] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    const [resolutions, setResolutions] = useState({})
    const [currentRes, setCurrentRes] = useState('')
    const [autoplay, setAutoplay] = useState(() => {
        const saved = localStorage.getItem('autoplay_drachin')
        return saved !== null ? JSON.parse(saved) : true
    })
    const videoRef = useRef(null)

    useEffect(() => {
        let suspended = false
        async function fetchAll() {
            setLoading(true)
            setError(null)
            try {
                const epData = await getDrachinEpisode(slug, index)
                const detailData = await getDrachinDetail(slug)
                
                if (!suspended) {
                    setEpisodeData(epData)
                    setDetail(detailData)

                    if (epData && epData.videos) {
                        setResolutions(epData.videos)
                        const available = Object.keys(epData.videos)
                        if (available.length > 0) {
                            available.sort((a, b) => parseInt(b) - parseInt(a))
                            setCurrentRes(available[0])
                        }
                    }

                    // Save to history
                    addToHistory({
                        animeId: slug, // Using slug as ID
                        episodeId: index,
                        title: detailData?.title || epData?.title || 'Drama China',
                        episodeTitle: `Episode ${epData.episode || index}`,
                        poster: epData.poster || detailData?.poster || detailData?.image,
                        type: 'drachin',
                        timestamp: Date.now()
                    })

                    // Add XP (10 points per episode watch)
                    if (user) {
                        addXP(user.id, 10).catch(err => console.error('Error adding XP:', err));
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
    }, [slug, index, user])

    const handleResolutionChange = (res) => {
        if (!videoRef.current) return
        const currentTime = videoRef.current.currentTime
        const isPaused = videoRef.current.paused
        setCurrentRes(res)
        
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.currentTime = currentTime
                if (!isPaused) {
                    videoRef.current.play().catch(e => console.log('Auto-play prevented:', e))
                }
            }
        }, 50)
    }

    const handleFullscreen = () => {
        const video = videoRef.current
        if (video) {
            if (video.requestFullscreen) video.requestFullscreen()
            else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen()
        }
    }

    const toggleAutoplay = () => {
        setAutoplay(prev => {
            const newValue = !prev
            localStorage.setItem('autoplay_drachin', JSON.stringify(newValue))
            return newValue
        })
    }

    const handleVideoEnded = () => {
        if (autoplay && nextEp) {
            navigate(`/drachin/${slug}/episode/${nextEp.index}`)
        }
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

    const title = detail?.title || episodeData?.title || 'Drama China'
    const episodeList = detail?.episodes || []
    const currentIndexNum = parseInt(index)
    const currentIndexInArray = episodeList.findIndex(ep => ep.index === index || parseInt(ep.index) === currentIndexNum)
    
    let prevEp = null
    let nextEp = null
    if (currentIndexInArray > 0) prevEp = episodeList[currentIndexInArray - 1]
    if (currentIndexInArray !== -1 && currentIndexInArray < episodeList.length - 1) nextEp = episodeList[currentIndexInArray + 1]

    const videoSrc = resolutions[currentRes]

    return (
        <div className="player-page">
            <div className="container">
                <div className="player-header">
                    <Link to={`/drachin/${slug}`} className="watch-back-btn">
                        <ArrowLeft size={16} /> Kembali ke Info
                    </Link>
                    <h1 className="player-title">
                        {title} - Ep {episodeData.episode || index}
                    </h1>
                </div>

                <div className="player-wrapper">
                    <div className="player-container">
                        {videoSrc ? (
                            <video
                                ref={videoRef}
                                src={videoSrc}
                                poster={episodeData.poster}
                                controls
                                autoPlay
                                playsInline
                                className="player-iframe"
                                style={{ objectFit: 'contain' }}
                                onEnded={handleVideoEnded}
                            />
                        ) : (
                            <div className="player-placeholder">
                                <p>Sumber video tidak ditemukan.</p>
                            </div>
                        )}
                    </div>

                    <div className="player-controls">
                        <div className="player-controls__nav">
                            {prevEp && (
                                <Link to={`/drachin/${slug}/episode/${prevEp.index}`} className="player-nav-btn">
                                    <ChevronLeft size={16} /> Sebelumnya
                                </Link>
                            )}
                            {nextEp && (
                                <Link to={`/drachin/${slug}/episode/${nextEp.index}`} className="player-nav-btn">
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
                        <Settings size={18} /> Pilih Kualitas
                    </h3>
                    <div className="server-quality">
                        <div className="server-quality__list">
                            {Object.keys(resolutions).map(res => (
                                <button
                                    key={res}
                                    className={`server-btn ${currentRes === res ? 'server-btn--active' : ''}`}
                                    onClick={() => handleResolutionChange(res)}
                                >
                                    <Play size={14} /> {res}
                                </button>
                            ))}
                        </div>
                    </div>
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
