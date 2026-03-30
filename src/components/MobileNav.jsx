import { Link, useLocation } from 'react-router-dom'
import { Home, Tags, Play, Heart, Clock, User, Tv } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function MobileNav() {
    const location = useLocation()
    const { isAuthenticated } = useAuth()

    const isActive = (path) => location.pathname === path
    const isWatchActive = location.pathname.startsWith('/watch')

    return (
        <div className="mobile-nav">
            <div className="mobile-nav__container">
                <Link
                    to="/"
                    className={`mobile-nav__link ${isActive('/') ? 'mobile-nav__link--active' : ''}`}
                >
                    <div className="mobile-nav__icon-wrap">
                        <Home size={22} />
                    </div>
                    <span>Beranda</span>
                </Link>

                <Link
                    to="/genres"
                    className={`mobile-nav__link ${isActive('/genres') ? 'mobile-nav__link--active' : ''}`}
                >
                    <div className="mobile-nav__icon-wrap">
                        <Tags size={22} />
                    </div>
                    <span>Genre</span>
                </Link>

                <Link
                    to="/drachin"
                    className={`mobile-nav__link ${location.pathname.startsWith('/drachin') ? 'mobile-nav__link--active' : ''}`}
                >
                    <div className="mobile-nav__icon-wrap">
                        <Tv size={22} fill={location.pathname.startsWith('/drachin') ? 'currentColor' : 'none'} />
                    </div>
                    <span>Drachin</span>
                </Link>

                <Link
                    to="/watch"
                    className={`mobile-nav__link ${isWatchActive ? 'mobile-nav__link--active' : ''}`}
                >
                    <div className="mobile-nav__icon-wrap">
                        <Play size={22} fill={isWatchActive ? 'currentColor' : 'none'} />
                    </div>
                    <span>Nonton</span>
                </Link>

                {isAuthenticated ? (
                    <>
                        <Link
                            to="/mylist"
                            className={`mobile-nav__link ${isActive('/mylist') ? 'mobile-nav__link--active' : ''}`}
                        >
                            <div className="mobile-nav__icon-wrap">
                                <Heart size={20} fill={isActive('/mylist') ? 'currentColor' : 'none'} />
                            </div>
                            <span>List</span>
                        </Link>
                        <Link
                            to="/history"
                            className={`mobile-nav__link ${isActive('/history') ? 'mobile-nav__link--active' : ''}`}
                        >
                            <div className="mobile-nav__icon-wrap">
                                <Clock size={20} />
                            </div>
                            <span>History</span>
                        </Link>
                        <Link
                            to="/profile"
                            className={`mobile-nav__link ${isActive('/profile') ? 'mobile-nav__link--active' : ''}`}
                        >
                            <div className="mobile-nav__icon-wrap">
                                <User size={20} />
                            </div>
                            <span>Profil</span>
                        </Link>
                    </>
                ) : (
                    <Link
                        to="/login"
                        className={`mobile-nav__link ${isActive('/login') ? 'mobile-nav__link--active' : ''}`}
                    >
                        <div className="mobile-nav__icon-wrap">
                            <User size={20} />
                        </div>
                        <span>Masuk</span>
                    </Link>
                )}
            </div>
        </div>
    )
}

export default MobileNav
