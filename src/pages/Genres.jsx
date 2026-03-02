import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getGenres } from '../services/api'
import { Tags, Search, ChevronRight } from 'lucide-react'
import Loader from '../components/Loader'

function Genres() {
    const [genres, setGenres] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        async function fetchGenres() {
            try {
                const data = await getGenres()
                // Sort alphabetically
                const sorted = data.sort((a, b) => a.name.localeCompare(b.name))
                setGenres(sorted)
            } catch (err) {
                console.error('Error fetching genres:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchGenres()
    }, [])

    const filteredGenres = genres.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase())
    )

    // Group by first letter
    const groupedGenres = filteredGenres.reduce((acc, genre) => {
        const firstLetter = genre.name[0].toUpperCase()
        if (!acc[firstLetter]) acc[firstLetter] = []
        acc[firstLetter].push(genre)
        return acc
    }, {})

    const alphabet = Object.keys(groupedGenres).sort()

    return (
        <div className="genres-page">
            <div className="container" style={{ paddingTop: 'var(--navbar-height)', paddingBottom: '80px' }}>
                <div className="genres-header">
                    <div className="genres-title-wrap">
                        <Tags className="accent" size={32} />
                        <div>
                            <h1 className="section-title" style={{ marginBottom: '4px' }}>Daftar <span className="accent">Genre</span></h1>
                            <p className="section-subtitle">Temukan anime berdasarkan kategori favoritmu</p>
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

                {loading ? (
                    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center' }}>
                        <Loader text="Memuat daftar genre..." />
                    </div>
                ) : (
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
                                                key={genre.mal_id}
                                                to={`/?genre=${genre.mal_id}`}
                                                className="genre-item-link"
                                            >
                                                <div className="genre-item-card">
                                                    <span className="genre-item-name">{genre.name}</span>
                                                    <div className="genre-item-count">{genre.count} Anime</div>
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
