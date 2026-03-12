import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getTopAnime } from '../services/api'
import { Star, Trophy } from 'lucide-react'

function TopAnimeSlider() {
    const [topAnime, setTopAnime] = useState([])
    const [loading, setLoading] = useState(true)
    const scrollRef = useRef(null)
    const trackRef = useRef(null)
    const isDragging = useRef(false)
    const startX = useRef(0)
    const scrollLeft = useRef(0)
    const animationId = useRef(null)
    const scrollSpeed = 0.8 // Slightly faster for better visibility

    useEffect(() => {
        const fetchTop = async () => {
            try {
                const res = await getTopAnime(1, '')
                setTopAnime(res.data?.slice(0, 10) || [])
            } catch (err) {
                console.error('Failed to fetch top anime for slider:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchTop()
    }, [])

    useEffect(() => {
        if (loading || topAnime.length === 0 || !scrollRef.current) return

        const scrollContainer = scrollRef.current

        // Initial position: start at the second set of items for seamless loop in both directions
        const setWidth = scrollContainer.scrollWidth / 3
        scrollContainer.scrollLeft = setWidth

        const autoScroll = () => {
            if (!isDragging.current) {
                scrollContainer.scrollLeft += scrollSpeed

                const currentScroll = scrollContainer.scrollLeft
                const singleSetWidth = scrollContainer.scrollWidth / 3

                // Seamless loop: If we reach the start of the 3rd set, jump back to the start of the 2nd set
                if (currentScroll >= singleSetWidth * 2) {
                    scrollContainer.scrollLeft = currentScroll - singleSetWidth
                }
                // If we drag backwards to the 1st set, jump to the 2nd set
                if (currentScroll <= 0) {
                    scrollContainer.scrollLeft = singleSetWidth
                }
            }
            animationId.current = requestAnimationFrame(autoScroll)
        }

        animationId.current = requestAnimationFrame(autoScroll)

        return () => cancelAnimationFrame(animationId.current)
    }, [loading, topAnime])

    const handleMouseDown = (e) => {
        isDragging.current = true
        scrollRef.current.style.cursor = 'grabbing'
        scrollRef.current.classList.add('active-drag')
        startX.current = e.pageX - scrollRef.current.offsetLeft
        scrollLeft.current = scrollRef.current.scrollLeft
    }

    const handleMouseLeaveOrUp = () => {
        isDragging.current = false
        if (scrollRef.current) {
            scrollRef.current.style.cursor = 'grab'
            scrollRef.current.classList.remove('active-drag')
        }
    }

    const handleMouseMove = (e) => {
        if (!isDragging.current) return
        e.preventDefault()
        const x = e.pageX - scrollRef.current.offsetLeft
        const walk = (x - startX.current) * 2
        scrollRef.current.scrollLeft = scrollLeft.current - walk

        // Loop check during manual drag
        const singleSetWidth = scrollRef.current.scrollWidth / 3
        if (scrollRef.current.scrollLeft >= singleSetWidth * 2) {
            scrollRef.current.scrollLeft -= singleSetWidth
            scrollLeft.current -= singleSetWidth
        } else if (scrollRef.current.scrollLeft <= 0) {
            scrollRef.current.scrollLeft += singleSetWidth
            scrollLeft.current += singleSetWidth
        }
    }

    const handleTouchStart = (e) => {
        isDragging.current = true
        startX.current = e.touches[0].pageX - scrollRef.current.offsetLeft
        scrollLeft.current = scrollRef.current.scrollLeft
    }

    const handleTouchMove = (e) => {
        if (!isDragging.current) return
        const x = e.touches[0].pageX - scrollRef.current.offsetLeft
        const walk = (x - startX.current) * 1.5
        scrollRef.current.scrollLeft = scrollLeft.current - walk

        // Loop check during touch move
        const singleSetWidth = scrollRef.current.scrollWidth / 3
        if (scrollRef.current.scrollLeft >= singleSetWidth * 2) {
            scrollRef.current.scrollLeft -= singleSetWidth
            scrollLeft.current -= singleSetWidth
        } else if (scrollRef.current.scrollLeft <= 0) {
            scrollRef.current.scrollLeft += singleSetWidth
            scrollLeft.current += singleSetWidth
        }
    }

    if (loading || topAnime.length === 0) return null

    return (
        <div
            className="top-slider"
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleMouseLeaveOrUp}
            onTouchMove={handleTouchMove}
            style={{
                cursor: 'grab',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                userSelect: 'none'
            }}
        >
            <div className="top-slider__track" ref={trackRef} style={{ animation: 'none' }}>
                {[...topAnime, ...topAnime, ...topAnime].map((anime, i) => (
                    <Link
                        key={`${anime.mal_id}-${i}`}
                        to={`/anime/${anime.mal_id}`}
                        className="top-slider__item"
                        draggable="false"
                        onClick={(e) => {
                            // Prevent navigation if we were dragging
                            // Note: this simple check might need refinement for actual production use
                        }}
                    >
                        <div className="top-slider__image-wrap">
                            <img src={anime.images.webp.large_image_url} alt={anime.title} draggable="false" />
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
