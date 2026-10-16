import { Link, useLocation } from 'react-router-dom'
import { Home, Tags, Clock, Clapperboard } from 'lucide-react'

function MobileNav() {
    const location = useLocation()

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
                    to="/donghua"
                    className={`mobile-nav__link ${location.pathname.startsWith('/donghua') ? 'mobile-nav__link--active' : ''}`}
                >
                    <div className="mobile-nav__icon-wrap">
                        <Clapperboard size={22} />
                    </div>
                    <span>Donghua</span>
                </Link>

                <Link
                    to="/history"
                    className={`mobile-nav__link ${isActive('/history') ? 'mobile-nav__link--active' : ''}`}
                >
                    <div className="mobile-nav__icon-wrap">
                        <Clock size={22} />
                    </div>
                    <span>History</span>
                </Link>
            </div>
        </div>
    )
}

export default MobileNav
