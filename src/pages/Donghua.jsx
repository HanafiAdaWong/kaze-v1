import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Play, TrendingUp, Sparkles, Navigation } from 'lucide-react'
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
                setSearchResults(result)
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
                            placeholder="Cari donghua kesukaanmu..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="watch-search__btn">
                            Cari
                        </button>
                    </form>
                </div>

                {loading && <Loader text="Memuat data donghua..." />}

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
                                {searchResults.map((donghua) => (
                                    <DonghuaCard key={donghua.slug} donghua={donghua} isEpisode={false} />
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
                        {/* Rekomendasi/Slider (These are series) */}
                        {homeData.slider?.length > 0 && (
                            <section className="watch-section" style={{ marginBottom: '40px' }}>
                                <div className="watch-section__header">
                                    <h2 className="section-title">
                                        <Navigation size={20} />
                                        <span>Rekomendasi <span className="accent">Epik</span></span>
                                    </h2>
                                </div>
                                <div className="anime-grid">
                                    {homeData.slider.map((donghua) => (
                                        <DonghuaCard key={donghua.slug} donghua={donghua} isEpisode={false} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Latest (These are episodes) */}
                        {homeData.latest?.length > 0 && (
                            <section className="watch-section">
                                <div className="watch-section__header">
                                    <h2 className="section-title">
                                        <Sparkles size={20} />
                                        <span>Update <span className="accent">Terbaru</span></span>
                                    </h2>
                                </div>
                                <div className="anime-grid">
                                    {homeData.latest.map((donghua) => (
                                        <DonghuaCard key={donghua.slug} donghua={donghua} isEpisode={true} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Popular (These are episodes) */}
                        {homeData.popular?.length > 0 && (
                            <section className="watch-section" style={{ marginTop: '40px' }}>
                                <div className="watch-section__header">
                                    <h2 className="section-title">
                                        <TrendingUp size={20} />
                                        <span>Paling <span className="accent">Populer</span></span>
                                    </h2>
                                </div>
                                <div className="anime-grid">
                                    {homeData.popular.map((donghua) => (
                                        <DonghuaCard key={donghua.slug} donghua={donghua} isEpisode={true} />
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
