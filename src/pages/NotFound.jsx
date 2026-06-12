import { Link } from 'react-router-dom'

function NotFound() {
    return (
        <div className="not-found">
            <div className="not-found__code">404</div>
            <p className="not-found__text">
                Oops! Halaman ini tidak ditemukan di dunia anime manapun.
            </p>
            <Link to="/" className="not-found__btn">
                Ke Beranda
            </Link>
        </div>
    )
}

export default NotFound
