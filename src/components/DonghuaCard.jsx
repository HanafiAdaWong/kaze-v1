import { Play } from 'lucide-react'
import { Link } from 'react-router-dom'

function DonghuaCard({ donghua }) {
    if (!donghua) return null

    const title = donghua.title
    const poster = donghua.poster
    const slug = (donghua.slug || '').replace(/\/$/, '')
    const status = donghua.status
    const type = donghua.type
    const href = donghua.href

    // If it's explicitly an episode link in the API, go to Player
    // Otherwise, go to Detail page
    let internalLink = `/donghua/${slug}`
    if (href && href.includes('/episode/')) {
        internalLink = `/donghua/episode/${slug}`
    }

    return (
        <Link to={internalLink} className="anime-card">
            <div className="anime-card__image-wrap">
                <img src={poster} alt={title} className="anime-card__image" loading="lazy" />
                {status && (
                    <div className="anime-card__score" style={{ background: status === 'Ongoing' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)' }}>
                        {status}
                    </div>
                )}
                {type && (
                    <div className="anime-card__type">{type}</div>
                )}
                {donghua.current_episode && (
                    <div className="anime-card__quality" style={{ top: 'auto', bottom: '10px', background: 'var(--accent-primary)' }}>
                        {donghua.current_episode}
                    </div>
                )}
                <div className="anime-card__overlay">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)' }}>
                        <Play size={16} fill="currentColor" /> Tonton
                    </div>
                </div>
            </div>
            <div className="anime-card__info">
                <h3 className="anime-card__title">{title}</h3>
                <div className="anime-card__meta">
                    {donghua.sub && <span>{donghua.sub}</span>}
                </div>
            </div>
        </Link>
    )
}

export default DonghuaCard
