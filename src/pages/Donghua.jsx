import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Play, TrendingUp, Sparkles } from 'lucide-react'
import { getDonghuaHome, searchDonghua } from '../services/api'
import Loader from '../components/Loader'
import DonghuaCard from '../components/DonghuaCard'

function Donghua() {
    const [searchParams, setSearchParams] = useSearchParams()
    const queryFromUrl = searchParams.get('q') || ''

    const [homeData, setHomeData] = useState(null)
    const [searchResults, setSearchResults] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState(queryFromUrl)

    const isSearchMode = !!queryFromUrl

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            if (queryFromUrl) {
                const result = await searchDonghua(queryFromUrl)
                setSearchResults(Array.isArray(result) ? result : [])
            } else {
                const data = await getDonghuaHome()
                setHomeData(data)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [queryFromUrl])

    useEffect(() => {
        fetchData()
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [fetchData])

    const handleSearch = (e) => {
        e.preventDefault()
        const trimmed = searchQuery.trim()
        if (trimmed) {
            setSearchParams({ q: trimmed })
        } else {
            setSearchParams({})
        }
    }

    return (
        <div style={{ paddingTop: 'calc(var(--navbar-height) + 32px)', minHeight: '100vh' }}>
            <div className="container">
                {/* Header */}
                <div className="watch-header">
                    <h1 className="section-title" style={{ fontSize: '2rem' }}>
                        <Play size={26} />
                        <span>Nonton <span className="accent">Donghua</span></span>
                    </h1>
                    <form className="watch-search" onSubmit={handleSearch}>
                        <Search className="watch-search__icon" size={18} />
                        <input
                            type="text"
                            className="watch-search__input"
                            placeholder="Cari donghua..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="watch-search__btn">
                            Cari
                        </button>
                    </form>
                </div>

                {loading && <Loader text="Memuat donghua..." />}

                {!loading && error && (
                    <div className="error-container">
                        <div className="error-container__title">Gagal memuat data</div>
                        <p className="error-container__message">{error}</p>
                        <button className="error-container__btn" onClick={fetchData}>Coba Lagi</button>
                    </div>
                )}

                {/* Search Results */}
                {!loading && !error && isSearchMode && searchResults && (
                    <div>
                        <h2 className="section-title">
                            Hasil pencarian: <span className="accent">"{queryFromUrl}"</span>
                        </h2>
                        {searchResults.length > 0 ? (
                            <div className="anime-grid">
                                {searchResults.map((d) => (
                                    <DonghuaCard key={d.slug} donghua={d} />
                                ))}
                            </div>
                        ) : (
                            <div className="error-container">
                                <div className="error-container__title">Tidak ditemukan</div>
                                <p className="error-container__message">Coba kata kunci lain.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Home Data */}
                {!loading && !error && !isSearchMode && homeData && (
                    <div>
                        {/* Latest Release */}
                        {homeData.latest_release?.length > 0 && (
                            <section className="watch-section">
                                <div className="watch-section__header">
                                    <h2 className="section-title">
                                        <Sparkles size={20} />
                                        <span>Update <span className="accent">Terbaru</span></span>
                                    </h2>
                                </div>
                                <div className="anime-grid">
                                    {homeData.latest_release.map((d) => (
                                        <DonghuaCard key={d.slug} donghua={d} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Completed */}
                        {homeData.completed_donghua?.length > 0 && (
                            <section className="watch-section">
                                <div className="watch-section__header">
                                    <h2 className="section-title">
                                        <TrendingUp size={20} />
                                        <span>Selesai <span className="accent">Tayang</span></span>
                                    </h2>
                                </div>
                                <div className="anime-grid">
                                    {homeData.completed_donghua.map((d) => (
                                        <DonghuaCard key={d.slug} donghua={d} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Donghua
