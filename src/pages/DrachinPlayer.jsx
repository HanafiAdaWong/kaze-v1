import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Settings, ChevronLeft, ChevronRight, Maximize2, RefreshCw } from 'lucide-react'
import { getDrachinDetail, getDrachinStream } from '../services/api'
import { addToHistory } from '../utils/history'
import { useAuth } from '../contexts/AuthContext'
import { addXP } from '../services/userStats'
import Loader from '../components/Loader'
import UnifiedPlayerUI from '../components/UnifiedPlayerUI'

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

    const unifiedEpisodesList = episodeList.map(ep => ({
        id: ep.vid,
        title: `Episode ${ep.vid_index}`,
        url: `/drachin/${slug}/episode/${ep.vid}`,
        isActive: ep.vid === vid
    }))

    const playerNode = videoSrc ? (
        <video
            ref={videoRef}
            src={videoSrc}
            poster={poster}
            controls
            autoPlay={autoplay}
            playsInline
            className="unified-video-iframe"
            style={{ objectFit: 'contain' }}
            onEnded={handleVideoEnded}
            referrerPolicy="no-referrer"
        />
    ) : (
        <iframe
            src={`https://www.dramabox.com/drama/41000121776/Watch-Out-Im-The-Lady-Boss`}
            className="unified-video-iframe"
            allowFullScreen
            title="DramaBox Player"
        />
    )

    return (
        <UnifiedPlayerUI
            title={`${title} - Ep ${currentEp?.vid_index || '??'}`}
            streamUrl={videoSrc}
            playerLoading={false}
            serverError={null}
            servers={[]} // Drachin only has one stream URL usually
            onServerClick={() => {}}
            prevEpUrl={prevEp ? `/drachin/${slug}/episode/${prevEp.vid}` : null}
            nextEpUrl={nextEp ? `/drachin/${slug}/episode/${nextEp.vid}` : null}
            metadata={{ credit: 'Drachin' }}
            genres={[]}
            animeData={{
                title: title,
                poster: detail?.series_cover,
                detailUrl: `/drachin/${slug}`
            }}
            episodesList={unifiedEpisodesList}
            onFullscreen={handleFullscreen}
            playerNode={playerNode}
        />
    )
}

export default DrachinPlayer

