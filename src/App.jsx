import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import MobileNav from './components/MobileNav'
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
import UserProfile from './pages/UserProfile'
import History from './pages/History'
import Genres from './pages/Genres'
import BatchDetail from './pages/BatchDetail'
import NotFound from './pages/NotFound'
import Drachin from './pages/Drachin'
import DrachinDetail from './pages/DrachinDetail'
import DrachinPlayer from './pages/DrachinPlayer'
import Donghua from './pages/Donghua'
import DonghuaDetail from './pages/DonghuaDetail'
import DonghuaPlayer from './pages/DonghuaPlayer'

function App() {
    return (
        <AuthProvider>
            <Navbar />
            <MobileNav />
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/anime/:id" element={<AnimeDetail />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/watch" element={<Watch />} />
                    <Route path="/user/:userId" element={<UserProfile />} />
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
                    <Route path="/genres" element={<Genres />} />
                    <Route path="/batch/:batchId" element={<BatchDetail />} />
                    <Route path="/drachin" element={<Drachin />} />
                    <Route path="/drachin/:slug" element={<DrachinDetail />} />
                    <Route path="/drachin/:slug/episode/:index" element={<DrachinPlayer />} />
                    <Route path="/donghua" element={<Donghua />} />
                    <Route path="/donghua/:slug" element={<DonghuaDetail />} />
                    <Route path="/donghua/episode/:slug" element={<DonghuaPlayer />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <Footer />
        </AuthProvider>
    )
}

export default App
