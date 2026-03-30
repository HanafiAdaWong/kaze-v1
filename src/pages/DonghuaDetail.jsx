import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Tv } from 'lucide-react'
import { getDonghuaDetail } from '../services/api'
import Loader from '../components/Loader'

function DonghuaDetail() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const [detail, setDetail] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let suspended = false
        async function fetchDetail() {
            setLoading(true)
            setError(null)
            try {
                const data = await getDonghuaDetail(slug)
                if (!suspended) setDetail(data)
            } catch (err) {
                if (!suspended) setError(err.message)
            } finally {
                if (!suspended) setLoading(false)
            }
        }
        fetchDetail()
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return () => { suspended = true }
    }, [slug])

    if (loading) {
        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader text="Memuat informasi Donghua..." />
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

    const title = detail.title
    const poster = detail.poster
    const synopsis = detail.synopsis
    const info = detail.info || {}
    const episodeList = detail.episode_list || []

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
                                <span className="badge badge--accent">Donghua</span>
                                {info.status && <span className="badge badge--success">{info.status}</span>}
                            </div>

                            <h1 className="detail__title">{title}</h1>

                            <div className="watch-detail-meta" style={{ flexWrap: 'wrap' }}>
                                <div className="watch-detail-meta__item">
                                    <Tv size={16} />
                                    <span>{info.episodes || episodeList.length} Episode</span>
                                </div>
                                {info.type && <span className="watch-detail-meta__dot" />}
                                {info.type && <span>{info.type}</span>}
                                {info.studio && <span className="watch-detail-meta__dot" />}
                                {info.studio && <span>{info.studio}</span>}
                            </div>

                            {synopsis && (
                                <p className="watch-detail-synopsis">
                                    {synopsis}
                                </p>
                            )}

                            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {episodeList.length > 0 && (
                                    <Link
                                        to={`/donghua/episode/${episodeList[episodeList.length - 1].slug}`}
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

                {episodeList.length === 0 ? (
                    <div className="error-container" style={{ minHeight: '200px' }}>
                        <div className="error-container__title">Belum ada episode</div>
                        <p className="error-container__message">Episode belum tersedia untuk donghua ini.</p>
                    </div>
                ) : (
                    <div className="episode-grid">
                        {/* Donghub episode_list might be newest to oldest, reverse it or just render */}
                        {episodeList.reverse().map((ep, i) => (
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
                                    <span className="episode-card__title">Ep {ep.episode}</span>
                                    {ep.date && <span className="episode-card__date" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ep.date}</span>}
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
