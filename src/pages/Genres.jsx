import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getWatchGenres } from '../services/api'
import { Tags, Search, ChevronRight } from 'lucide-react'
import Loader from '../components/Loader'

function Genres() {
    const [genres, setGenres] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchGenres() {
            try {
                setLoading(true)
                const data = await getWatchGenres()
                
                // Exclude boys-love, girls-love, shoujo-ai, shounen-ai and yaoi/yuri variants
                const excludedIds = ['boys-love', 'girls-love', 'shoujo-ai', 'shounen-ai', 'yaoi', 'yuri']
                const filtered = data.filter(g => {
                    const id = (g.genreId || '').toLowerCase()
                    const title = (g.title || '').toLowerCase()
                    return !excludedIds.includes(id) && 
                           !title.includes('boys love') && 
                           !title.includes('girls love')
                })

                // Sort alphabetically by title
                const sorted = filtered.sort((a, b) => a.title.localeCompare(b.title))
                setGenres(sorted)
            } catch (err) {
                console.error('Error fetching genres:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchGenres()
    }, [])

    const filteredGenres = genres.filter(g =>
        g.title.toLowerCase().includes(search.toLowerCase())
    )

    // Group by first letter
    const groupedGenres = filteredGenres.reduce((acc, genre) => {
        const firstLetter = genre.title[0].toUpperCase()
        if (!acc[firstLetter]) acc[firstLetter] = []
        acc[firstLetter].push(genre)
        return acc
    }, {})

    const alphabet = Object.keys(groupedGenres).sort()

    return (
        <div className="genres-page">
            <div className="container" style={{ paddingTop: 'calc(var(--navbar-height) + 32px)', paddingBottom: '80px' }}>
                <div className="genres-header">
                    <div className="genres-title-wrap">
                        <Tags className="accent" size={32} />
                        <div>
                            <h1 className="section-title" style={{ marginBottom: '4px' }}>Daftar <span className="accent">Genre</span></h1>
                            <p className="section-subtitle">Temukan anime berdasarkan kategori favoritmu dari Otakudesu</p>
                        </div>
                    </div>

                    <div className="genres-search">
                        <Search size={18} className="genres-search-icon" />
                        <input
                            type="text"
                            placeholder="Cari genre..."
                            className="genres-search-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading && (
                    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
                        <Loader text="Memuat daftar genre..." />
                    </div>
                )}

                {!loading && error && (
                    <div className="error-container">
                        <div className="error-container__title">Gagal memuat genre</div>
                        <p className="error-container__message">{error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <div className="genres-list-container">
                        {alphabet.length === 0 ? (
                            <div className="genres-empty">Genre tidak ditemukan.</div>
                        ) : (
                            alphabet.map(letter => (
                                <div key={letter} className="genre-group">
                                    <div className="genre-group__letter">{letter}</div>
                                    <div className="genre-group__list">
                                        {groupedGenres[letter].map(genre => (
                                            <Link
                                                key={genre.genreId}
                                                to={`/genres/${genre.genreId}?title=${encodeURIComponent(genre.title)}`}
                                                className="genre-item-link"
                                            >
                                                <div className="genre-item-card">
                                                    <span className="genre-item-name">{genre.title}</span>
                                                    <ChevronRight size={16} className="genre-item-arrow" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Genres
