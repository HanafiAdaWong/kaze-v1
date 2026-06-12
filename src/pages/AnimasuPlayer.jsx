import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MonitorPlay, Maximize2, Monitor } from 'lucide-react'
import { getAnimasuEpisodeDetail } from '../services/api'
import { addToHistory } from '../utils/history'
import { useAuth } from '../contexts/AuthContext'
import { addXP } from '../services/userStats'
import Loader from '../components/Loader'
import UnifiedPlayerUI from '../components/UnifiedPlayerUI'

function AnimasuPlayer() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [episodeData, setEpisodeData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeServer, setActiveServer] = useState(null)

    useEffect(() => {
        let cancelled = false
        async function fetchEp() {
            setLoading(true)
            setError(null)
            try {
                const json = await getAnimasuEpisodeDetail(slug)
                if (!cancelled) {
                    setEpisodeData(json)
                    
                    const streams = json.streams || []
                    if (streams.length > 0) {
                        setActiveServer(streams[0])
                    }

                    // Save to history
                    addToHistory({
                        animeId: slug,
                        episodeId: slug,
                        title: json.title || 'Animasu Anime',
                        episodeTitle: json.title || slug,
                        poster: 'https://ik.imagekit.io/lhtvft4ai/Logo%20kaze.png', // Generic poster if none
                        type: 'animasu',
                        timestamp: Date.now()
                    })

                    // Add XP
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
    }, [slug, user])

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
                <Loader text="Menyiapkan pemutar video Animasu..." />
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

    const title = episodeData.title || ''
    const streams = episodeData.streams || []

    const flatServers = streams.map((server, i) => ({
        id: server.name,
        name: server.name,
        isActive: activeServer?.name === server.name,
        url: server.url
    }))

    const handleServerClick = (id) => {
        const server = streams.find(s => s.name === id)
        if (server) setActiveServer(server)
    }

    return (
        <UnifiedPlayerUI
            title={title}
            streamUrl={activeServer?.url || null}
            playerLoading={false}
            serverError={null}
            servers={flatServers}
            onServerClick={handleServerClick}
            metadata={{}}
            animeData={{
                title: title, // Animasu episode detail doesn't include full anime details yet
                detailUrl: navigate(-1) // fallback just go back
            }}
            onFullscreen={handleFullscreen}
        />
    )
}

export default AnimasuPlayer
