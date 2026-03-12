import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, ExternalLink, HardDrive, FileText } from 'lucide-react'
import { getBatchDetail } from '../services/api'
import Loader from '../components/Loader'

function BatchDetail() {
    const { batchId } = useParams()
    const navigate = useNavigate()
    const [batch, setBatch] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            setError(null)
            try {
                const data = await getBatchDetail(batchId)
                setBatch(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [batchId])

    if (loading) {
        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader text="Memuat batch download..." />
            </div>
        )
    }

    if (error || !batch) {
        return (
            <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh' }}>
                <div className="error-container">
                    <div className="error-container__title">Gagal memuat batch</div>
                    <p className="error-container__message">{error || 'Data tidak ditemukan.'}</p>
                    <button className="error-container__btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> Kembali
                    </button>
                </div>
            </div>
        )
    }

    const title = batch.title || 'Batch Download'
    const genreList = batch.genreList || []
    const downloadFormats = batch.downloadUrl?.formats || []

    return (
        <div className="batch-page" style={{ paddingTop: 'var(--navbar-height)', paddingBottom: '80px' }}>
            {/* Header Hero */}
            <div className="watch-detail-hero" style={{ height: '400px' }}>
                <div className="watch-detail-hero__bg">
                    <img src={batch.poster} alt="" />
                    <div className="watch-detail-hero__overlay" />
                </div>
                <div className="container">
                    <div className="watch-detail-hero__content">
                        <div className="watch-detail-hero__poster" style={{ maxWidth: '200px' }}>
                            <img src={batch.poster} alt={title} />
                        </div>
                        <div className="watch-detail-hero__info">
                            <button onClick={() => navigate(-1)} className="watch-back-btn">
                                <ArrowLeft size={16} /> Kembali
                            </button>
                            <h1 className="detail__title">{title}</h1>
                            <div className="detail__badges">
                                {batch.type && <span className="badge badge--accent">{batch.type}</span>}
                                {batch.score && <span className="badge badge--warning">Score: {batch.score}</span>}
                                {batch.aired && <span className="badge badge--info">{batch.aired}</span>}
                            </div>
                            <div className="detail__genres" style={{ marginTop: '12px' }}>
                                {genreList.map(g => (
                                    <span key={g.genreId} className="badge badge--outline">{g.title}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ marginTop: '40px' }}>
                <h2 className="section-title">
                    <Download size={24} />
                    <span>Link <span className="accent">Download Batch</span></span>
                </h2>

                {downloadFormats.length === 0 ? (
                    <div className="error-container" style={{ minHeight: '200px' }}>
                        <p className="error-container__message">Link download belum tersedia untuk batch ini.</p>
                    </div>
                ) : (
                    <div className="batch-list">
                        {downloadFormats.map((format, idx) => (
                            <div key={idx} className="batch-format-card">
                                <h3 className="batch-format-title">
                                    <FileText size={18} /> {format.title}
                                </h3>

                                <div className="batch-qualities">
                                    {format.qualities.map((quality, qIdx) => (
                                        <div key={qIdx} className="batch-quality-item">
                                            <div className="batch-quality-header">
                                                <div className="batch-quality-label">
                                                    <HardDrive size={16} />
                                                    <span>{quality.title}</span>
                                                    <span className="batch-size-tag">{quality.size}</span>
                                                </div>
                                            </div>
                                            <div className="batch-links">
                                                {quality.urls.map((u, uIdx) => (
                                                    <a
                                                        key={uIdx}
                                                        href={u.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="batch-link-btn"
                                                    >
                                                        {u.title} <ExternalLink size={12} />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default BatchDetail
