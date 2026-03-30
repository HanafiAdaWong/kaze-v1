import { Play } from 'lucide-react'
import { Link } from 'react-router-dom'

function DrachinCard({ drachin }) {
    if (!drachin) return null

    const title = drachin.title
    const poster = drachin.poster
    const slug = drachin.slug
    const eps = drachin.episode_info

    return (
        <Link to={`/drachin/${slug}`} className="anime-card">
            <div className="anime-card__image-container" style={{ aspectRatio: '3 / 4.5' }}>
                <img src={poster} alt={title} className="anime-card__image" loading="lazy" />
                <div className="anime-card__overlay">
                    <div className="anime-card__play">
                        <Play size={24} fill="currentColor" />
                    </div>
                </div>
                {eps && (
                    <div className="anime-card__badge" style={{ top: '8px', right: '8px', zIndex: 10 }}>
                        {eps}
                    </div>
                )}
            </div>
            <div className="anime-card__content">
                <h3 className="anime-card__title">{title}</h3>
            </div>
        </Link>
    )
}

export default DrachinCard
