import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import AnimeDetail from './pages/AnimeDetail'
import Watch from './pages/Watch'
import WatchAnimeDetail from './pages/WatchAnimeDetail'
import EpisodePlayer from './pages/EpisodePlayer'
import AuthPage from './pages/AuthPage'
import MyList from './pages/MyList'
import Profile from './pages/Profile'
import History from './pages/History'
import NotFound from './pages/NotFound'

function App() {
    return (
        <AuthProvider>
            <Navbar />
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/anime/:id" element={<AnimeDetail />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/watch" element={<Watch />} />
                    <Route path="/mylist" element={
                        <ProtectedRoute>
                            <MyList />
                        </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    } />
                    <Route path="/history" element={<History />} />
                    <Route path="/watch/:animeId" element={<WatchAnimeDetail />} />
                    <Route
                        path="/watch/:animeId/episode/:episodeId"
                        element={
                            <ProtectedRoute>
                                <EpisodePlayer />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <Footer />
        </AuthProvider>
    )
}

export default App
