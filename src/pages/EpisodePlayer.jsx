import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, ChevronLeft, ChevronRight, Play, Monitor, Maximize2
} from 'lucide-react'
import { getEpisodeDetail, getServerUrl, getWatchAnimeDetail, getAnimasuEpisodeDetail, getZoronimeEpisodeDetail, getAnoboyEpisodeDetail, getSamehadakuEpisodeDetail } from '../services/api'
import { addToHistory } from '../utils/history'
import Loader from '../components/Loader'
import Comments from '../components/Comments'
import UnifiedPlayerUI from '../components/UnifiedPlayerUI'
import { translate } from '../utils/translator'
import { useAuth } from '../contexts/AuthContext'
import { addXP } from '../services/userStats'

function EpisodePlayer() {
    const { animeId, episodeId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [episode, setEpisode] = useState(null)
    const [animeDetail, setAnimeDetail] = useState(null)
    const [activeServer, setActiveServer] = useState(null)
    const [streamUrl, setStreamUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [playerLoading, setPlayerLoading] = useState(false)
    const [error, setError] = useState(null)
    const [serverError, setServerError] = useState(null)
    const [translatedSynopsis, setTranslatedSynopsis] = useState('')
    const [translating, setTranslating] = useState(false)
    const [isBypass, setIsBypass] = useState(false)

    const handleBypass = async (source) => {
        setLoading(true)
        setError(null)
        setStreamUrl(null)
        setActiveServer(null)
        try {
            let data
            let bypassSlug = episodeId

            if (source === 'animasu' && !bypassSlug.startsWith('nonton-')) {
                bypassSlug = `nonton-${bypassSlug}`
            }

            if (source === 'anoboy') {
                // Anoboy often uses '...subtitle-indonesia' suffix
                if (!bypassSlug.includes('subtitle-indonesia')) {
                    bypassSlug = `${bypassSlug}-subtitle-indonesia`
                }
                data = await getAnoboyEpisodeDetail(bypassSlug)
            } else if (source === 'animasu') {
                data = await getAnimasuEpisodeDetail(bypassSlug)
            } else if (source === 'zoronime') {
                data = await getZoronimeEpisodeDetail(bypassSlug)
            } else if (source === 'samehadaku') {
                data = await getSamehadakuEpisodeDetail(bypassSlug)
            }

            if (!data || (!data.streams && !data.data)) {
                throw new Error('Data tidak lengkap dari server ini.')
            }

            const finalData = data.data || data
            setEpisode({
                ...finalData,
                source: source.charAt(0).toUpperCase() + source.slice(1),
                title: finalData.title || episode?.title || `Episode ${episodeId}`
            })
            setIsBypass(true)

            // Auto-load first stream if available
            const streams = finalData.streams || []
            if (streams.length > 0) {
                setStreamUrl(streams[0].url)
                setActiveServer('bypass-0')
            } else if (finalData.server?.qualities?.length > 0) {
                const firstQuality = finalData.server.qualities.find(q => q.serverList?.length > 0)
                if (firstQuality) {
                    const firstServer = firstQuality.serverList[0]
                    const serverData = await getServerUrl(firstServer.serverId, source)
                    setStreamUrl(serverData.url)
                    setActiveServer(firstServer.serverId)
                }
            }
        } catch (err) {
            setError(`Server ${source} gagal: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }


    // Fetch episode detail
    useEffect(() => {
        let cancelled = false
        async function fetchEpisode() {
            setLoading(true)
            setError(null)
            setStreamUrl(null)
            setActiveServer(null)
            setServerError(null)
            try {
                // Fetch both episode and anime detail (for history)
                const [data, detail] = await Promise.all([
                    getEpisodeDetail(episodeId),
                    getWatchAnimeDetail(animeId).catch(() => null)
                ])

                if (cancelled) return
                setEpisode(data)
                setAnimeDetail(detail)

                // Translate synopsis
                if (data.synopsis?.paragraphs?.[0]) {
                    setTranslating(true)
                    translate(data.synopsis.paragraphs[0]).then(t => {
                        if (!cancelled) {
                            setTranslatedSynopsis(t)
                            setTranslating(false)
                        }
                    })
                }

                // Save to history
                if (detail?.data) {
                    const anime = detail.data;
                    addToHistory({
                        animeId,
                        episodeId,
                        title: anime.english || anime.synonyms || anime.title || animeId,
                        episodeTitle: data.title || `Episode ${episodeId}`,
                        poster: anime.poster || anime.image || anime.img,
                        type: 'anime',
                        timestamp: Date.now()
                    })
                }

                // Add XP (10 points per episode watch)
                if (user) {
                    addXP(user.id, 10).catch(err => console.error('Error adding XP:', err));
                }

                // Auto-load first available server
                if (data.defaultStreamingUrl) {
                    setStreamUrl(data.defaultStreamingUrl)
                    setActiveServer('default')
                } else if (data.server?.qualities?.length > 0) {
                    // Find first quality with servers
                    for (const q of data.server.qualities) {
                        if (q.serverList?.length > 0) {
                            const first = q.serverList[0]
                            setActiveServer(first.serverId)
                            setPlayerLoading(true)
                            try {
                                const currentSource = data.source ? data.source.toLowerCase() : ''
                                const serverData = await getServerUrl(first.serverId, currentSource)
                                if (!cancelled) {
                                    setStreamUrl(serverData.url)
                                }
                            } catch (err) {
                                if (!cancelled) {
                                    setServerError('Gagal memuat server. Coba pilih server lain.')
                                    console.error('Auto-load server failed:', err)
                                }
                            } finally {
                                if (!cancelled) setPlayerLoading(false)
                            }
                            break
                        }
                    }
                }
            } catch (err) {
                if (!cancelled) setError(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        fetchEpisode()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return () => { cancelled = true }
    }, [episodeId])

    const loadServer = async (serverId) => {
        setPlayerLoading(true)
        setServerError(null)
        try {
            const currentSource = episode?.source ? episode.source.toLowerCase() : ''
            const data = await getServerUrl(serverId, currentSource)
            setStreamUrl(data.url)
            setActiveServer(serverId)
        } catch (err) {
            console.error('Failed to load server:', err)
            setServerError('Server gagal dimuat: ' + (err.message || 'Coba server lain.'))
        } finally {
            setPlayerLoading(false)
        }
    }

    const handleServerClick = async (serverId, qualityTitle) => {
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
                <Loader text="Memuat episode..." />
            </div>
        )
    }

    if (error || !episode) {
        const is404 = error?.includes('404') || error?.includes('tidak ditemukan');

        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
                <div className="error-container">
                    <div className="error-container__title">Gagal memuat episode</div>
                    <p className="error-container__message">{error || 'Episode tidak ditemukan.'}</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="error-container__btn" onClick={() => navigate(`/watch/${animeId}`)}>
                            Kembali ke Daftar Episode
                        </button>
                        {is404 && (
                            <>
                                <button
                                    className="error-container__btn error-container__btn--secondary"
                                    onClick={() => navigate(`/watch?q=${encodeURIComponent(animeId.replace(/-/g, ' '))}`)}
                                >
                                    Cari Manual di Server
                                </button>
                                <button
                                    className="error-container__btn"
                                    style={{ background: '#22c55e', border: 'none' }}
                                    onClick={() => handleBypass('samehadaku')}
                                >
                                    Gunakan Server Samehadaku
                                </button>
                                <button
                                    className="error-container__btn"
                                    style={{ background: 'var(--accent-primary)', border: 'none' }}
                                    onClick={() => handleBypass('animasu')}
                                >
                                    Gunakan Server Animasu
                                </button>
                                <button
                                    className="error-container__btn"
                                    style={{ background: '#3b82f6', border: 'none' }}
                                    onClick={() => handleBypass('zoronime')}
                                >
                                    Gunakan Server Zoronime
                                </button>
                                <button
                                    className="error-container__btn"
                                    style={{ background: '#f59e0b', border: 'none' }}
                                    onClick={() => handleBypass('anoboy')}
                                >
                                    Gunakan Server Anoboy
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const allQualities = episode.server?.qualities || []

    // Build unified qualities for sidebar
    const unifiedQualities = allQualities.map(q => ({
        title: q.title,
        servers: q.serverList.map(s => ({
            id: s.serverId,
            name: s.title,
            isActive: activeServer === s.serverId
        }))
    }))

    // Build flat servers for controls bar (bypass + default)
    let flatServers = []
    if (episode.streams && episode.streams.length > 0) {
        episode.streams.forEach((stream, i) => {
            flatServers.push({
                id: `bypass-${i}`,
                name: stream.name,
                isActive: activeServer === `bypass-${i}`
            })
        })
    }
    if (episode.defaultStreamingUrl) {
        flatServers.push({ id: 'default', name: 'Player Default', isActive: activeServer === 'default' })
    }

    const handleUnifiedServerClick = (serverId) => {
        if (serverId === activeServer) return

        // Handle bypass stream clicks
        if (serverId.startsWith('bypass-')) {
            const idx = parseInt(serverId.replace('bypass-', ''))
            const stream = episode.streams?.[idx]
            if (stream) {
                setStreamUrl(stream.url)
                setActiveServer(serverId)
                setServerError(null)
            }
            return
        }

        handleServerClick(serverId, '')
    }

    // Build episodes list from anime detail if available
    const episodesList = animeDetail?.episodeList?.map(ep => ({
        id: ep.episodeId,
        title: `Episode ${ep.title || ep.episodeId}`,
        url: `/watch/${animeId}/episode/${ep.episodeId}`,
        isActive: ep.episodeId === episodeId
    }))?.reverse() || []

    const genres = episode.genreList?.map(g => g.title) || []
    const synopsis = translating ? 'Menterjemahkan sinopsis...' : (translatedSynopsis || episode.synopsis?.paragraphs?.[0] || '')

    return (
        <>
            <UnifiedPlayerUI
                title={episode.title}
                streamUrl={streamUrl}
                playerLoading={playerLoading}
                serverError={serverError}
                servers={flatServers}
                qualities={unifiedQualities}
                onServerClick={handleUnifiedServerClick}
                prevEpUrl={episode.hasPrevEpisode && episode.prevEpisode ? `/watch/${animeId}/episode/${episode.prevEpisode.episodeId}` : null}
                nextEpUrl={episode.hasNextEpisode && episode.nextEpisode ? `/watch/${animeId}/episode/${episode.nextEpisode.episodeId}` : null}
                metadata={{
                    duration: animeDetail?.duration || '',
                    credit: episode.source || 'Otakudesu',
                }}
                genres={genres}
                animeData={{
                    title: animeDetail?.title || episode.title,
                    poster: animeDetail?.poster,
                    score: animeDetail?.score?.value,
                    status: animeDetail?.status,
                    detailUrl: `/watch/${animeId}`
                }}
                episodesList={episodesList}
                onFullscreen={handleFullscreen}
            />
            {/* Comments section below the unified player */}
            <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 20px 60px' }}>
                {synopsis && (
                    <div className="unified-info-box" style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>Sinopsis</h3>
                        <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.6 }}>{synopsis}</p>
                    </div>
                )}
                <Comments animeId={episodeId} />
            </div>
        </>
    )
}

export default EpisodePlayer
