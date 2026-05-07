import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Settings, ChevronLeft, ChevronRight, Maximize2, RefreshCw } from 'lucide-react'
import { getDrachinDetail, getDrachinStream } from '../services/api'
import { addToHistory } from '../utils/history'
import { useAuth } from '../contexts/AuthContext'
import { addXP } from '../services/userStats'
import Loader from '../components/Loader'

function DrachinPlayer() {
    const { slug, index: vid } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [streamData, setStreamData] = useState(null)
    const [detail, setDetail] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
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
                const stream = await getDrachinStream(vid)
                const detailData = await getDrachinDetail(slug)
                
                if (!suspended) {
                    setStreamData(stream)
                    setDetail(detailData)

                    const currentEp = detailData?.video_list?.find(v => v.vid === vid)

                    // Save to history
                    addToHistory({
                        animeId: slug,
                        episodeId: vid,
                        title: detailData?.series_title || 'Drama China',
                        episodeTitle: `Episode ${currentEp?.vid_index || '??'}`,
                        poster: detailData?.series_cover,
                        type: 'drachin',
                        timestamp: Date.now()
                    })

                    // Add XP
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
    }, [slug, vid, user])

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
            navigate(`/drachin/${slug}/episode/${nextEp.vid}`)
        }
    }

    if (loading) {
        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader text="Menyiapkan pemutar video..." />
            </div>
        )
    }

    const title = detail?.series_title || 'Drama China'
    const episodeList = detail?.video_list || []
    const currentIndexInArray = episodeList.findIndex(ep => ep.vid === vid)
    const currentEp = episodeList[currentIndexInArray]
    
    let prevEp = null
    let nextEp = null
    if (currentIndexInArray > 0) prevEp = episodeList[currentIndexInArray - 1]
    if (currentIndexInArray !== -1 && currentIndexInArray < episodeList.length - 1) nextEp = episodeList[currentIndexInArray + 1]

    // Melolo stream response parsing
    const videoSrc = streamData?.data?.url || streamData?.url || null

    let poster = currentEp?.cover || detail?.series_cover
    if (poster) {
        poster = `https://images.weserv.nl/?url=${encodeURIComponent(poster)}&output=webp`
    }

    return (
        <div className="player-page">
            <div className="container">
                <div className="player-header">
                    <Link to={`/drachin/${slug}`} className="watch-back-btn">
                        <ArrowLeft size={16} /> Kembali ke Info
                    </Link>
                    <h1 className="player-title">
                        {title} - Ep {currentEp?.vid_index || '??'}
                    </h1>
                </div>

                <div className="player-wrapper">
                    <div className="player-container">
                        {videoSrc ? (
                            <video
                                ref={videoRef}
                                src={videoSrc}
                                poster={poster}
                                controls
                                autoPlay
                                playsInline
                                className="player-iframe"
                                style={{ objectFit: 'contain' }}
                                onEnded={handleVideoEnded}
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <iframe
                                src={`https://www.dramabox.com/drama/41000121776/Watch-Out-Im-The-Lady-Boss`} // Fallback static for testing or dynamic if I find id
                                className="player-iframe"
                                allowFullScreen
                                title="DramaBox Player"
                            />
                        )}
                    </div>

                    <div className="player-controls">
                        <div className="player-controls__nav">
                            {prevEp && (
                                <Link to={`/drachin/${slug}/episode/${prevEp.vid}`} className="player-nav-btn">
                                    <ChevronLeft size={16} /> Sebelumnya
                                </Link>
                            )}
                            {nextEp && (
                                <Link to={`/drachin/${slug}/episode/${nextEp.vid}`} className="player-nav-btn">
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

                {episodeList.length > 0 && (
                    <div style={{ marginTop: '40px' }}>
                        <h2 className="section-title">
                            <Play size={20} />
                            <span>Pilih <span className="accent">Episode</span></span>
                        </h2>
                        <div className="episode-grid">
                            {episodeList.map((ep) => (
                                <Link
                                    key={ep.vid}
                                    to={`/drachin/${slug}/episode/${ep.vid}`}
                                    className={`episode-card ${ep.vid === vid ? 'episode-card--active' : ''}`}
                                >
                                    <div className="episode-card__info">
                                        <span className="episode-card__title">Ep {ep.vid_index}</span>
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

