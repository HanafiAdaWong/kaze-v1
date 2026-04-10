import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Sparkles, TrendingUp, ArrowRight, ChevronLeft, ChevronRight, Tags } from 'lucide-react'
import { getTopAnime, searchAnime, getGenres, getAnimeByGenre } from '../services/api'
import AnimeCard from '../components/AnimeCard'
import TopAnimeSlider from '../components/TopAnimeSlider'
import HeroBanner from '../components/HeroBanner'
import Loader from '../components/Loader'

const FILTERS = [
    { label: 'Semua', value: '' },
    { label: '🔥 Tayang', value: 'airing' },
    { label: '📅 Akan Datang', value: 'upcoming' },
    { label: '🏆 Populer', value: 'bypopularity' },
    { label: '❤️ Favorit', value: 'favorite' },
]

function Home() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()

    const queryFromUrl = searchParams.get('q') || ''
    const filterFromUrl = searchParams.get('filter') || ''
    const genreFromUrl = searchParams.get('genre') || ''
    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10)

    const [animeList, setAnimeList] = useState([])
    const [genres, setGenres] = useState([])
    const [pagination, setPagination] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [heroQuery, setHeroQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState(filterFromUrl)
    const [activeGenre, setActiveGenre] = useState(genreFromUrl)

    const isSearchMode = !!queryFromUrl

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            let result
            if (queryFromUrl) {
                result = await searchAnime(queryFromUrl, pageFromUrl)
            } else if (genreFromUrl) {
                result = await getAnimeByGenre(genreFromUrl, pageFromUrl)
            } else {
                result = await getTopAnime(pageFromUrl, activeFilter)
            }
            setAnimeList(result.data || [])
            setPagination(result.pagination || null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [queryFromUrl, pageFromUrl, activeFilter, genreFromUrl])

    useEffect(() => {
        fetchData()
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [fetchData])

    // Initial genre fetch
    useEffect(() => {
        getGenres().then(setGenres).catch(console.error)
    }, [])

    // Sync filter and genre from URL
    useEffect(() => {
        setActiveFilter(filterFromUrl)
        setActiveGenre(genreFromUrl)
    }, [filterFromUrl, genreFromUrl])

    const handleHeroSearch = (e) => {
        e.preventDefault()
        const trimmed = heroQuery.trim()
        if (trimmed) {
            setSearchParams({ q: trimmed })
        }
    }

    const handleFilterChange = (filterValue) => {
        setActiveFilter(filterValue)
        setActiveGenre('') // Reset genre when filter changes
        const params = {}
        if (filterValue) params.filter = filterValue
        setSearchParams(params)
    }

    const handleGenreChange = (genreId) => {
        setActiveGenre(genreId)
        setActiveFilter('') // Reset filter when genre changes
        const params = {}
        if (genreId) params.genre = genreId
        setSearchParams(params)
    }

    const goToPage = (page) => {
        const params = {}
        if (queryFromUrl) params.q = queryFromUrl
        if (activeFilter) params.filter = activeFilter
        if (activeGenre) params.genre = activeGenre
        if (page > 1) params.page = page
        setSearchParams(params)
    }

    return (
        <div>
            {/* Hero Section - only on first page with no search */}
            {!isSearchMode && pageFromUrl === 1 && (
                <section className="hero">
                    <HeroBanner />
                    <div className="container">
                        <div className="hero__container">
                            <div className="hero__content">
                                <div className="hero__tag">
                                    <Sparkles size={14} />
                                    Temukan Anime Favorit Berikutnya
                                </div>
                                <h1 className="hero__title">
                                    Jelajahi Dunia <span className="gradient-text">Anime</span>
                                </h1>
                                <p className="hero__description">
                                    Telusuri ribuan judul anime, baca sinopsis, cek rating,
                                    dan temukan serial favoritmu.
                                </p>
                                <form className="hero__search" onSubmit={handleHeroSearch}>
                                    <Search className="hero__search-icon" size={20} />
                                    <input
                                        type="text"
                                        className="hero__search-input"
                                        placeholder="Cari judul anime..."
                                        value={heroQuery}
                                        onChange={(e) => setHeroQuery(e.target.value)}
                                    />
                                    <button type="submit" className="hero__search-btn">
                                        <ArrowRight size={18} />
                                    </button>
                                </form>
                            </div>

                            <div className="hero__slider-wrap">
                                <h3 className="section-subtitle" style={{ marginBottom: '16px', fontSize: '0.9rem', opacity: 0.8 }}>
                                    🔥 Anime Terbaik Minggu Ini
                                </h3>
                                <TopAnimeSlider />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Main Content */}
            <section style={{ paddingTop: isSearchMode || pageFromUrl > 1 ? 'calc(var(--navbar-height) + 40px)' : '0' }}>
                <div className="container">
                    {/* Search Result Header */}
                    {isSearchMode && (
                        <div style={{ marginBottom: '24px' }}>
                            <h2 className="section-title">
                                Hasil pencarian: <span className="accent">"{queryFromUrl}"</span>
                            </h2>
                        </div>
                    )}

                    {/* Filter Tabs */}
                    {!isSearchMode && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
                            <h2 className="section-title" style={{ marginBottom: 0 }}>
                                <TrendingUp size={22} />
                                <span>Anime <span className="accent">Terbaik</span></span>
                            </h2>
                        </div>
                    )}

                    {!isSearchMode && (
                        <div className="filter-tabs">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.value}
                                    className={`filter-tab ${activeFilter === f.value ? 'filter-tab--active' : ''}`}
                                    onClick={() => handleFilterChange(f.value)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {!isSearchMode && genres.length > 0 && (
                        <div className="genre-scroller-wrap">
                            <div className="genre-scroller">
                                <button
                                    className={`genre-chip ${!activeGenre ? 'genre-chip--active' : ''}`}
                                    onClick={() => handleGenreChange('')}
                                >
                                    Semua Genre
                                </button>
                                {genres.map(g => (
                                    <button
                                        key={g.mal_id}
                                        className={`genre-chip ${activeGenre === String(g.mal_id) ? 'genre-chip--active' : ''}`}
                                        onClick={() => handleGenreChange(String(g.mal_id))}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && <Loader text="Memuat anime..." />}

                    {/* Error */}
                    {!loading && error && (
                        <div className="error-container">
                            <div className="error-container__title">Terjadi Kesalahan</div>
                            <p className="error-container__message">{error}</p>
                            <button className="error-container__btn" onClick={fetchData}>
                                Coba Lagi
                            </button>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !error && animeList.length === 0 && (
                        <div className="error-container">
                            <div className="error-container__title">Tidak ditemukan</div>
                            <p className="error-container__message">
                                Coba cari dengan kata kunci lain atau jelajahi anime terbaik.
                            </p>
                            <button className="error-container__btn" onClick={() => navigate('/')}>
                                Ke Sinopsis
                            </button>
                        </div>
                    )}

                    {/* Anime Grid */}
                    {!loading && !error && animeList.length > 0 && (
                        <>
                            <div className="anime-grid">
                                {animeList.map((anime, i) => (
                                    <AnimeCard key={anime.mal_id} anime={anime} index={i} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.last_visible_page > 1 && (
                                <div className="pagination">
                                    <button
                                        className="pagination__btn"
                                        disabled={!pagination.has_previous_page && pageFromUrl <= 1}
                                        onClick={() => goToPage(pageFromUrl - 1)}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    <span className="pagination__info">
                                        Hal. {pageFromUrl} dari {pagination.last_visible_page}
                                    </span>

                                    <button
                                        className="pagination__btn"
                                        disabled={!pagination.has_next_page}
                                        onClick={() => goToPage(pageFromUrl + 1)}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    )
}

export default Home
