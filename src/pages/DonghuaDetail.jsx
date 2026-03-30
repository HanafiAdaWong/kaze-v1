import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Tv, Calendar, User } from 'lucide-react'
import { getDonghuaDetail } from '../services/api'
import Loader from '../components/Loader'

function DonghuaDetail() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const [detail, setDetail] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
        async function fetchDetail() {
            setLoading(true)
            setError(null)
            try {
                const json = await getDonghuaDetail(slug)
                if (!cancelled) {
                    // The detail endpoint returns {data: {..., episodes_list: [...]}}
                    setDetail(json.data || json)
                }
            } catch (err) {
                if (!cancelled) setError(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        fetchDetail()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return () => { cancelled = true }
    }, [slug])

    if (loading) {
        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader text="Memuat detail donghua..." />
            </div>
        )
    }

    if (error || !detail) {
        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
                <div className="error-container">
                    <div className="error-container__title">Gagal memuat donghua</div>
                    <p className="error-container__message">{error || 'Data tidak ditemukan.'}</p>
                    <button className="error-container__btn" onClick={() => navigate('/donghua')}>
                        Kembali ke Donghua
                    </button>
                </div>
            </div>
        )
    }

    const title = detail.title || ''
    const poster = detail.poster || ''
    const synopsis = detail.synopsis || ''
    const type = detail.type || 'Donghua'
    const status = detail.status || ''
    const released = detail.released || ''
    const uploader = detail.uploader || ''
    // Episodes come from the detail endpoint
    const episodeList = detail.episodes_list || []

    // Reverse the episode list so oldest (ep 1) is first
    const sortedEpisodes = [...episodeList].reverse()

    // Extract a short episode number from the full title
    const getEpNumber = (epTitle) => {
        const match = epTitle.match(/episode\s*(\d+)/i)
        return match ? match[1] : epTitle
    }

    return (
        <div className="detail" style={{ paddingTop: 'var(--navbar-height)' }}>
            {/* Hero */}
            <div className="watch-detail-hero">
                <div className="watch-detail-hero__bg">
                    <img src={poster} alt="" />
                    <div className="watch-detail-hero__overlay" />
                </div>
                <div className="container">
                    <div className="watch-detail-hero__content">
                        <div className="watch-detail-hero__poster">
                            <img src={poster} alt={title} />
                        </div>
                        <div className="watch-detail-hero__info">
                            <button
                                onClick={() => navigate('/donghua')}
                                className="watch-back-btn"
                            >
                                <ArrowLeft size={16} /> Kembali
                            </button>

                            <div className="detail__badges">
                                <span className="badge badge--accent">{type}</span>
                                {status && <span className="badge">{status}</span>}
                            </div>

                            <h1 className="detail__title">{title}</h1>

                            <div className="watch-detail-meta">
                                <div className="watch-detail-meta__item">
                                    <Tv size={16} />
                                    <span>{sortedEpisodes.length} Episode</span>
                                </div>
                                {released && (
                                    <div className="watch-detail-meta__item">
                                        <Calendar size={16} />
                                        <span>{released}</span>
                                    </div>
                                )}
                                {uploader && (
                                    <div className="watch-detail-meta__item">
                                        <User size={16} />
                                        <span>{uploader}</span>
                                    </div>
                                )}
                            </div>

                            {synopsis && (
                                <p className="watch-detail-synopsis">{synopsis}</p>
                            )}

                            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {sortedEpisodes.length > 0 && (
                                    <Link
                                        to={`/donghua/episode/${sortedEpisodes[0].slug}`}
                                        className="detail__btn detail__btn--primary"
                                        style={{ display: 'inline-flex' }}
                                    >
                                        <Play size={16} /> Mulai Menonton
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Episodes List */}
            <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
                <h2 className="section-title">
                    <Play size={20} />
                    <span>Daftar <span className="accent">Episode</span></span>
                </h2>

                {sortedEpisodes.length === 0 ? (
                    <div className="error-container" style={{ minHeight: '200px' }}>
                        <div className="error-container__title">Belum ada episode</div>
                        <p className="error-container__message">Episode belum tersedia untuk donghua ini.</p>
                    </div>
                ) : (
                    <div className="episode-grid">
                        {sortedEpisodes.map((ep, i) => (
                            <Link
                                key={ep.slug}
                                to={`/donghua/episode/${ep.slug}`}
                                className="episode-card"
                                style={{ animationDelay: `${Math.min(i, 20) * 0.03}s` }}
                            >
                                <div className="episode-card__number">
                                    <Play size={14} />
                                </div>
                                <div className="episode-card__info">
                                    <span className="episode-card__title">{getEpNumber(ep.episode)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DonghuaDetail
