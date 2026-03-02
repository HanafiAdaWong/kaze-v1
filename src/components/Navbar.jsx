import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Play, LogIn, LogOut, User, Heart, Clock, Home as HomeIcon, Tags } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [query, setQuery] = useState('')
    const [showUserMenu, setShowUserMenu] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const { user, isAuthenticated, signOut, loading } = useAuth()

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Close user menu on route change
    useEffect(() => {
        setShowUserMenu(false)
    }, [location.pathname])

    // Sync query from URL params (only for home page search)
    useEffect(() => {
        if (location.pathname === '/') {
            const params = new URLSearchParams(location.search)
            const q = params.get('q') || ''
            setQuery(q)
        }
    }, [location.search, location.pathname])

    const handleSearch = (e) => {
        e.preventDefault()
        const trimmed = query.trim()
        if (trimmed) {
            navigate(`/?q=${encodeURIComponent(trimmed)}`)
        } else {
            navigate('/')
        }
    }

    const handleSignOut = async () => {
        await signOut()
        setShowUserMenu(false)
        navigate('/')
    }

    const isWatchSection = location.pathname.startsWith('/watch')
    const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="container">
                <Link to="/" className="navbar__logo">
                    <img src="https://ik.imagekit.io/lhtvft4ai/Logo%20kaze.png" alt="Kazedonime" className="navbar__logo-img" />
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
                        to="/watch"
                        className={`navbar__link ${isWatchSection ? 'navbar__link--active' : ''}`}
                    >
                        <span><Play size={14} fill="currentColor" /> Nonton</span>
                    </Link>
                    {isAuthenticated && (
                        <>
                            <Link to="/mylist" className={`navbar__link ${location.pathname === '/mylist' ? 'navbar__link--active' : ''}`}>
                                <span><Heart size={14} /> List Saya</span>
                            </Link>
                            <Link to="/history" className={`navbar__link ${location.pathname === '/history' ? 'navbar__link--active' : ''}`}>
                                <span><Clock size={14} /> History</span>
                            </Link>
                        </>
                    )}
                </div>

                {/* Auth section - Outside navbar__links for mobile visibility */}
                <div className="navbar__auth-section">
                    {!loading && (
                        <>
                            {isAuthenticated ? (
                                <div className="navbar__user" style={{ position: 'relative' }}>
                                    <button
                                        className="navbar__user-btn"
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                    >
                                        <div className="navbar__avatar">
                                            {user?.user_metadata?.avatar_url ? (
                                                <img src={user.user_metadata.avatar_url} alt="Avatar" className="navbar__avatar-img" />
                                            ) : (
                                                displayName.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <span className="navbar__user-name">{displayName}</span>
                                    </button>

                                    {showUserMenu && (
                                        <>
                                            <div
                                                className="navbar__user-backdrop"
                                                onClick={() => setShowUserMenu(false)}
                                            />
                                            <div className="navbar__user-menu">
                                                <div className="navbar__user-menu-header">
                                                    <div className="navbar__user-menu-info">
                                                        <span className="navbar__user-menu-name">{displayName}</span>
                                                        <span className="navbar__user-menu-email">{user?.email}</span>
                                                    </div>
                                                </div>
                                                <Link to="/profile" className="navbar__user-menu-item">
                                                    <User size={16} /> Profil
                                                </Link>
                                                <Link to="/mylist" className="navbar__user-menu-item">
                                                    <Heart size={16} /> List Saya
                                                </Link>
                                                <Link to="/history" className="navbar__user-menu-item">
                                                    <Clock size={16} /> History
                                                </Link>
                                                <button
                                                    className="navbar__user-menu-item navbar__user-menu-item--danger"
                                                    onClick={handleSignOut}
                                                >
                                                    <LogOut size={16} /> Keluar
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <Link to="/login" className="navbar__auth-btn">
                                    <LogIn size={16} />
                                    <span>Masuk</span>
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar
