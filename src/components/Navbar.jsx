import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Home as HomeIcon, Tags, Clapperboard, Clock } from 'lucide-react'

function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [query, setQuery] = useState('')
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Sync query from URL params (only for search results page)
    useEffect(() => {
        if (location.pathname === '/watch') {
            const params = new URLSearchParams(location.search)
            const q = params.get('q') || ''
            setQuery(q)
        } else {
            setQuery('')
        }
    }, [location.search, location.pathname])

    const handleSearch = (e) => {
        e.preventDefault()
        const trimmed = query.trim()
        if (trimmed) {
            navigate(`/watch?q=${encodeURIComponent(trimmed)}`)
        }
    }

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="container">
                <Link to="/" className="navbar__logo">
                    <img src="/logo-kaze.png" alt="Kazedonime" className="navbar__logo-img" />
                    <span className="gradient-text">Kazedonime</span>
                </Link>

                <form className="navbar__search" onSubmit={handleSearch}>
                    <Search className="navbar__search-icon" size={18} />
                    <input
                        type="text"
                        className="navbar__search-input"
                        placeholder="Cari anime..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </form>

                <div className="navbar__links">
                    <Link
                        to="/"
                        className={`navbar__link ${location.pathname === '/' ? 'navbar__link--active' : ''}`}
                    >
                        <span><HomeIcon size={14} /> Beranda</span>
                    </Link>

                    <Link
                        to="/genres"
                        className={`navbar__link ${location.pathname === '/genres' ? 'navbar__link--active' : ''}`}
                    >
                        <span><Tags size={14} /> Genre</span>
                    </Link>
                    <Link
                        to="/donghua"
                        className={`navbar__link ${location.pathname.startsWith('/donghua') ? 'navbar__link--active' : ''}`}
                    >
                        <span><Clapperboard size={14} /> Donghua</span>
                    </Link>
                    <Link to="/history" className={`navbar__link ${location.pathname === '/history' ? 'navbar__link--active' : ''}`}>
                        <span><Clock size={14} /> History</span>
                    </Link>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
