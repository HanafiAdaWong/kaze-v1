import { useState, useEffect } from 'react'
import { getTopAnime } from '../services/api'

function HeroBanner() {
    const [banners, setBanners] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                // Fetch top 10 to ensure we have enough good banners
                const res = await getTopAnime(1, 'airing')
                setBanners(res.data?.slice(0, 8) || [])
            } catch (err) {
                console.error('Failed to fetch hero banners:', err)
            }
        }
        fetchBanners()
    }, [])

    useEffect(() => {
        if (banners.length === 0) return

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % banners.length)
        }, 7000) // Longer interval for cinematic feel

        return () => clearInterval(interval)
    }, [banners])

    if (banners.length === 0) {
        return (
            <div className="hero__bg">
                <div className="hero__bg-overlay" />
            </div>
        )
    }

    return (
        <div className="hero__bg">
            {banners.map((banner, index) => (
                <div
                    key={banner.mal_id}
                    className="hero__bg-item"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: index === currentIndex ? 1 : 0,
                        zIndex: index === currentIndex ? 1 : 0,
                        transition: 'opacity 2.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        overflow: 'hidden'
                    }}
                >
                    <img
                        src={banner.images.webp.large_image_url}
                        alt={banner.title}
                        className="hero__bg-image"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.65, // Increased opacity for brightness
                            filter: 'blur(2px) brightness(0.95)', // Increased brightness, decreased blur
                            transform: index === currentIndex ? 'scale(1.15)' : 'scale(1.05)',
                            transition: 'transform 8s ease-out, opacity 2.5s ease-in-out'
                        }}
                    />
                </div>
            ))}
            {/* Darker overlay at the bottom to transition to content, but clearer at top */}
            <div className="hero__bg-overlay" style={{ background: 'linear-gradient(to bottom, rgba(10,10,15,0.1) 0%, rgba(10,10,15,0.4) 50%, var(--bg-primary) 100%)' }} />

            {/* Glowing Blue Border Bottom */}
            <div className="hero__glow-border" />
        </div>
    )
}

export default HeroBanner

