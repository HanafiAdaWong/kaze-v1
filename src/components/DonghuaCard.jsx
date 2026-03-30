import { Play } from 'lucide-react'
import { Link } from 'react-router-dom'

function DonghuaCard({ donghua, isEpisode = false }) {
    if (!donghua) return null

    const title = donghua.title
    const poster = donghua.poster
    const slug = donghua.slug
    // API returns `episode` or sometimes we might want to just show `Ongoing`/`Completed` status
    const status_or_ep = donghua.episode || donghua.status || donghua.episode_info

    // If it's an episode slug (from popular/latest), link directly to the player
    // If it's a series slug (from slider/search), link to the detail page
    const linkTo = isEpisode ? `/donghua/episode/${slug}` : `/donghua/${slug}`

    return (
        <Link to={linkTo} className="anime-card">
            <div className="anime-card__image-container" style={{ aspectRatio: '3 / 4.5' }}>
                <img src={poster} alt={title} className="anime-card__image" loading="lazy" />
                <div className="anime-card__overlay">
                    <div className="anime-card__play">
                        <Play size={24} fill="currentColor" />
                    </div>
                </div>
                {status_or_ep && (
                    <div className="anime-card__badge" style={{ top: '8px', right: '8px', zIndex: 10 }}>
                        {status_or_ep}
                    </div>
                )}
            </div>
            <div className="anime-card__content">
                <h3 className="anime-card__title">{title}</h3>
            </div>
        </Link>
    )
}

export default DonghuaCard
