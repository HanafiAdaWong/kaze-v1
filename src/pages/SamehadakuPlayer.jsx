import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MonitorPlay, Maximize2, Monitor, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { getSamehadakuEpisodeDetail, getServerUrl } from '../services/api'
import { addToHistory } from '../utils/history'
import { useAuth } from '../contexts/AuthContext'
import { addXP } from '../services/userStats'
import Loader from '../components/Loader'
import UnifiedPlayerUI from '../components/UnifiedPlayerUI'

function SamehadakuPlayer() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [episode, setEpisode] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeServer, setActiveServer] = useState(null)
    const [streamUrl, setStreamUrl] = useState(null)
    const [playerLoading, setPlayerLoading] = useState(false)
    const [serverError, setServerError] = useState(null)

    useEffect(() => {
        let cancelled = false
        async function fetchEp() {
            setLoading(true)
            setError(null)
            try {
                const data = await getSamehadakuEpisodeDetail(slug)
                if (!cancelled) {
                    const finalData = data.data || data
                    setEpisode(finalData)

                    // Save to history
                    addToHistory({
                        animeId: finalData.animeId || slug,
                        episodeId: slug,
                        title: finalData.title || 'Samehadaku Anime',
                        episodeTitle: finalData.title || slug,
                        poster: finalData.poster || 'https://ik.imagekit.io/lhtvft4ai/Logo%20kaze.png',
                        type: 'samehadaku',
                        timestamp: Date.now()
                    })

                    // Add XP
                    if (user) {
                        addXP(user.id, 10).catch(err => console.error('Error adding XP:', err));
                    }

                    // Auto-load first available server
                    if (finalData.defaultStreamingUrl) {
                        setStreamUrl(finalData.defaultStreamingUrl)
                        setActiveServer('default')
                    } else if (finalData.server?.qualities?.length > 0) {
                        for (const q of finalData.server.qualities) {
                            if (q.serverList?.length > 0) {
                                const first = q.serverList[0]
                                setActiveServer(first.serverId)
                                setPlayerLoading(true)
                                try {
                                    const serverData = await getServerUrl(first.serverId, 'samehadaku')
                                    if (!cancelled) {
                                        setStreamUrl(serverData.url)
                                    }
                                } catch (err) {
                                    if (!cancelled) {
                                        setServerError('Gagal memuat server. Coba pilih server lain.')
                                    }
                                } finally {
                                    if (!cancelled) setPlayerLoading(false)
                                }
                                break
                            }
                        }
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

    const loadServer = async (serverId) => {
        setPlayerLoading(true)
        setServerError(null)
        try {
            const data = await getServerUrl(serverId, 'samehadaku')
            setStreamUrl(data.url)
            setActiveServer(serverId)
        } catch (err) {
            console.error('Failed to load server:', err)
            setServerError('Server gagal dimuat: ' + (err.message || 'Coba server lain.'))
        } finally {
            setPlayerLoading(false)
        }
    }

    const handleServerClick = async (serverId) => {
        if (serverId === activeServer) return

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
                <Loader text="Menyiapkan pemutar video Samehadaku..." />
            </div>
        )
    }

    if (error || !episode) {
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

    const title = episode.title || ''
    const animeId = episode.animeId || ''
    const hasPrev = episode.hasPrevEpisode
    const prevEp = episode.prevEpisode
    const hasNext = episode.hasNextEpisode
    const nextEp = episode.nextEpisode

    const qualities = episode.server?.qualities?.map(q => ({
        title: q.title,
        servers: q.serverList?.map(s => ({
            id: s.serverId,
            name: s.title,
            isActive: activeServer === s.serverId
        })) || []
    })) || []

    let flatServers = []
    if (episode.defaultStreamingUrl) {
        flatServers.push({ id: 'default', name: 'Server Utama', isActive: activeServer === 'default' })
    }
    
    // Fallback if no qualities list but has servers (just in case)
    if (qualities.length === 0 && episode.serverList) {
         flatServers = [ ...flatServers, ...episode.serverList.map(s => ({
             id: s.serverId,
             name: s.title,
             isActive: activeServer === s.serverId
         }))]
    }

    const episodesList = episode.recommendedEpisodeList?.map(ep => ({
        id: ep.episodeId,
        title: ep.title ? (isNaN(ep.title) ? ep.title : `Episode ${ep.title}`) : ep.title,
        url: `/samehadaku/episode/${ep.episodeId}`,
        isActive: ep.episodeId === slug
    })) || []

    return (
        <UnifiedPlayerUI
            title={title}
            streamUrl={streamUrl}
            playerLoading={playerLoading}
            serverError={serverError}
            servers={flatServers}
            qualities={qualities}
            onServerClick={handleServerClick}
            prevEpUrl={hasPrev && prevEp?.episodeId ? `/samehadaku/episode/${prevEp.episodeId}` : null}
            nextEpUrl={hasNext && nextEp?.episodeId ? `/samehadaku/episode/${nextEp.episodeId}` : null}
            metadata={{
                duration: episode.duration || 'N/A',
                credit: 'Samehadaku',
            }}
            genres={episode.genreList?.map(g => g.title) || []}
            animeData={{
                title: title, // Samehadaku doesn't send anime title in episode API, using episode title as fallback
                poster: episode.poster,
                detailUrl: `/samehadaku/${animeId}`
            }}
            episodesList={episodesList}
            onFullscreen={handleFullscreen}
        />
    )
}

export default SamehadakuPlayer
