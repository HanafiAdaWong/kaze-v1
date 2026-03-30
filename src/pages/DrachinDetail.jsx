import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Tv, Sparkles } from 'lucide-react'
import { getDrachinDetail } from '../services/api'
import Loader from '../components/Loader'
import DrachinCard from '../components/DrachinCard'

function DrachinDetail() {
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
                const data = await getDrachinDetail(slug)
                if (!cancelled) setDetail(data)
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
                <Loader text="Memuat kelengkapan data..." />
            </div>
        )
    }

    if (error || !detail) {
        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
                <div className="error-container">
                    <div className="error-container__title">Gagal memuat drama</div>
                    <p className="error-container__message">{error || 'Data tidak ditemukan.'}</p>
                    <button className="error-container__btn" onClick={() => navigate('/drachin')}>
                        Kembali ke Drachin
                    </button>
                </div>
            </div>
        )
    }

    const title = detail.title
    const episodeList = detail.episodes || []
    const recommendations = detail.recommendations || []

    return (
        <div className="detail" style={{ paddingTop: 'var(--navbar-height)' }}>
            {/* Hero */}
            <div className="watch-detail-hero">
                <div className="watch-detail-hero__bg">
                    <img src={detail.poster} alt="" />
                    <div className="watch-detail-hero__overlay" />
                </div>
                <div className="container">
                    <div className="watch-detail-hero__content">
                        <div className="watch-detail-hero__poster">
                            <img src={detail.poster} alt={title} />
                        </div>
                        <div className="watch-detail-hero__info">
                            <button
                                onClick={() => navigate('/drachin')}
                                className="watch-back-btn"
                            >
                                <ArrowLeft size={16} /> Kembali
                            </button>

                            <div className="detail__badges">
                                <span className="badge badge--accent">Drachin</span>
                            </div>

                            <h1 className="detail__title">{title}</h1>

                            <div className="watch-detail-meta">
                                <div className="watch-detail-meta__item">
                                    <Tv size={16} />
                                    <span>{episodeList.length} Episode</span>
                                </div>
                            </div>

                            {detail.synopsis && (
                                <p className="watch-detail-synopsis">
                                    {detail.synopsis}
                                </p>
                            )}

                            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {episodeList.length > 0 && (
                                    <Link
                                        to={`/drachin/${slug}/episode/${episodeList[0].index}`}
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
            <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
                <h2 className="section-title">
                    <Play size={20} />
                    <span>Daftar <span className="accent">Episode</span></span>
                </h2>

                {episodeList.length === 0 ? (
                    <div className="error-container" style={{ minHeight: '200px' }}>
                        <div className="error-container__title">Belum ada episode</div>
                        <p className="error-container__message">Episode belum tersedia untuk drama ini.</p>
                    </div>
                ) : (
                    <div className="episode-grid">
                        {episodeList.map((ep, i) => (
                            <Link
                                key={ep.index}
                                to={`/drachin/${slug}/episode/${ep.index}`}
                                className="episode-card"
                                style={{ animationDelay: `${Math.min(i, 20) * 0.03}s` }}
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
                )}
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div className="container" style={{ paddingBottom: '80px' }}>
                    <h2 className="section-title">
                        <Sparkles size={20} />
                        <span>Mungkin Anda <span className="accent">Suka</span></span>
                    </h2>
                    <div className="anime-grid">
                        {recommendations.map(drachin => (
                            <DrachinCard key={drachin.slug} drachin={drachin} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default DrachinDetail
