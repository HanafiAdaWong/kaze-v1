import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'

function OngoingAnimeSlider({ animes = [] }) {
    const scrollRef = useRef(null)
    const trackRef = useRef(null)
    const isDragging = useRef(false)
    const startX = useRef(0)
    const scrollLeft = useRef(0)
    const animationId = useRef(null)
    const scrollSpeed = 0.8

    useEffect(() => {
        if (animes.length === 0 || !scrollRef.current) return

        const scrollContainer = scrollRef.current

        // Initial position: start at the second set of items for seamless loop
        const setWidth = scrollContainer.scrollWidth / 3
        scrollContainer.scrollLeft = setWidth

        const autoScroll = () => {
            if (!isDragging.current) {
                scrollContainer.scrollLeft += scrollSpeed

                const currentScroll = scrollContainer.scrollLeft
                const singleSetWidth = scrollContainer.scrollWidth / 3

                if (currentScroll >= singleSetWidth * 2) {
                    scrollContainer.scrollLeft = currentScroll - singleSetWidth
                }
                if (currentScroll <= 0) {
                    scrollContainer.scrollLeft = singleSetWidth
                }
            }
            animationId.current = requestAnimationFrame(autoScroll)
        }

        animationId.current = requestAnimationFrame(autoScroll)

        return () => cancelAnimationFrame(animationId.current)
    }, [animes])

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

        const singleSetWidth = scrollRef.current.scrollWidth / 3
        if (scrollRef.current.scrollLeft >= singleSetWidth * 2) {
            scrollRef.current.scrollLeft -= singleSetWidth
            scrollLeft.current -= singleSetWidth
        } else if (scrollRef.current.scrollLeft <= 0) {
            scrollRef.current.scrollLeft += singleSetWidth
            scrollLeft.current += singleSetWidth
        }
    }

    if (animes.length === 0) return null

    // Use top 10 animes for the slider
    const displayAnimes = animes.slice(0, 10)

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
                {[...displayAnimes, ...displayAnimes, ...displayAnimes].map((anime, i) => (
                    <Link
                        key={`${anime.animeId}-${i}`}
                        to={`/watch/${anime.animeId}`}
                        className="top-slider__item"
                        draggable="false"
                        onClick={(e) => {
                            // Prevent nav logic if needed
                        }}
                    >
                        <div className="top-slider__image-wrap">
                            <img src={anime.poster} alt={anime.title} draggable="false" />
                            <div className="top-slider__badge" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
                                <Play size={12} fill="currentColor" />
                                <span>Ep {anime.episodes}</span>
                            </div>
                        </div>
                        <h4 className="top-slider__title">{anime.title}</h4>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default OngoingAnimeSlider
