import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, MonitorPlay, ChevronLeft, ChevronRight, Maximize2, Monitor, RefreshCw } from 'lucide-react'
import { getDonghuaEpisode } from '../services/api'
import { addToHistory } from '../utils/history'
import { useAuth } from '../contexts/AuthContext'
import { addXP } from '../services/userStats'
import Loader from '../components/Loader'
import UnifiedPlayerUI from '../components/UnifiedPlayerUI'

function DonghuaPlayer() {
    const { episodeSlug } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

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

                    // Save to history
                    addToHistory({
                        animeId: json.donghua_details?.slug || json.slug || episodeSlug,
                        episodeId: episodeSlug,
                        title: json.donghua_details?.title || json.title || 'Donghua',
                        episodeTitle: json.episode || episodeSlug,
                        poster: json.donghua_details?.poster || json.poster || json.donghua_details?.image || json.image,
                        type: 'donghua',
                        timestamp: Date.now()
                    })

                    // Add XP (10 points per episode watch)
                    if (user) {
                        addXP(user.id, 10).catch(err => console.error('Error adding XP:', err));
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
    }, [episodeSlug, user])

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
    const donghuaSlug = donghuaDetails.slug || episodeData.slug || ''
    const donghuaTitle = donghuaDetails.title || episodeData.title || ''
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

    const flatServers = servers.map(srv => ({
        id: srv.url, // URL as ID since donghua servers don't always have IDs
        name: srv.name,
        isActive: activeServer?.url === srv.url,
        url: srv.url
    }))

    const handleServerClick = (id) => {
        const server = servers.find(s => s.url === id)
        if (server) setActiveServer(server)
    }

    const unifiedEpisodesList = sortedEpisodes.map(ep => ({
        id: ep.slug,
        title: `Episode ${getEpNumber(ep.episode)}`,
        url: `/donghua/episode/${ep.slug}`,
        isActive: ep.slug === episodeSlug
    }))

    return (
        <UnifiedPlayerUI
            title={`${donghuaTitle} - ${getEpNumber(episodeTitle)}`}
            streamUrl={activeServer?.url || null}
            playerLoading={false}
            serverError={null}
            servers={flatServers}
            onServerClick={handleServerClick}
            prevEpUrl={nav.prev?.slug ? `/donghua/episode/${nav.prev.slug}` : null}
            nextEpUrl={nav.next?.slug ? `/donghua/episode/${nav.next.slug}` : null}
            metadata={{ credit: 'Donghua' }}
            genres={donghuaDetails.genres || []}
            animeData={{
                title: donghuaTitle,
                poster: donghuaDetails.poster || donghuaDetails.image,
                score: donghuaDetails.score || donghuaDetails.rating,
                status: donghuaDetails.status,
                detailUrl: `/donghua/${donghuaSlug}`
            }}
            episodesList={unifiedEpisodesList}
            onFullscreen={handleFullscreen}
        />
    )
}

export default DonghuaPlayer
