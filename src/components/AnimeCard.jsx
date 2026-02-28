import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'

function AnimeCard({ anime, index = 0 }) {
    const navigate = useNavigate()

    const imageUrl =
        anime.images?.webp?.large_image_url ||
        anime.images?.jpg?.large_image_url ||
        anime.images?.jpg?.image_url

    const title =
        anime.title_english || anime.title || anime.titles?.[0]?.title || 'Unknown'

    return (
        <div
            className="anime-card"
            style={{ animationDelay: `${index * 0.04}s` }}
            onClick={() => navigate(`/anime/${anime.mal_id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/anime/${anime.mal_id}`)}
        >
            <div className="anime-card__image-wrap">
                <img
                    className="anime-card__image"
                    src={imageUrl}
                    alt={title}
                    loading="lazy"
                />

                {anime.score && (
                    <div className="anime-card__score">
                        <Star size={12} fill="currentColor" />
                        {anime.score}
                    </div>
                )}

                {anime.type && (
                    <div className="anime-card__type">{anime.type}</div>
                )}

                <div className="anime-card__overlay">
                    <p className="anime-card__overlay-text">
                        {anime.synopsis || 'No synopsis available.'}
                    </p>
                </div>
            </div>

            <div className="anime-card__info">
                <h3 className="anime-card__title">{title}</h3>
                <div className="anime-card__meta">
                    {anime.episodes != null && (
                        <span>{anime.episodes} eps</span>
                    )}
                    {anime.episodes != null && anime.status && (
                        <span className="anime-card__meta-dot" />
                    )}
                    {anime.status && (
                        <span>{anime.status === 'Currently Airing' ? 'Airing' : anime.status === 'Finished Airing' ? 'Finished' : anime.status}</span>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AnimeCard
