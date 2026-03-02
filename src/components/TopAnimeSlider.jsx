import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getTopAnime } from '../services/api'
import { Star, Trophy } from 'lucide-react'

function TopAnimeSlider() {
    const [topAnime, setTopAnime] = useState([])
    const [loading, setLoading] = useState(true)
    const scrollRef = useRef(null)

    useEffect(() => {
        const fetchTop = async () => {
            try {
                const res = await getTopAnime(1, '')
                // Get top 10 items
                setTopAnime(res.data?.slice(0, 10) || [])
            } catch (err) {
                console.error('Failed to fetch top anime for slider:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchTop()
    }, [])

    if (loading || topAnime.length === 0) return null

    return (
        <div className="top-slider">
            <div className="top-slider__track">
                {/* Double the list for seamless loop */}
                {[...topAnime, ...topAnime].map((anime, i) => (
                    <Link
                        key={`${anime.mal_id}-${i}`}
                        to={`/anime/${anime.mal_id}`}
                        className="top-slider__item"
                    >
                        <div className="top-slider__image-wrap">
                            <img src={anime.images.webp.large_image_url} alt={anime.title} />
                            <div className="top-slider__badge">
                                <Trophy size={12} fill="currentColor" />
                                <span>#{i % 10 + 1}</span>
                            </div>
                            <div className="top-slider__score">
                                <Star size={12} fill="currentColor" />
                                <span>{anime.score}</span>
                            </div>
                        </div>
                        <h4 className="top-slider__title">{anime.title_english || anime.title}</h4>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default TopAnimeSlider
