import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUserProfile, getUserComments } from '../services/comments'
import { User, MessageSquare, Calendar, ArrowLeft, Loader2, Play } from 'lucide-react'
import Loader from '../components/Loader'

function UserProfile() {
    const { userId } = useParams()
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchUserData() {
            setLoading(true)
            setError(null)
            try {
                const [profileRes, commentsRes] = await Promise.all([
                    getUserProfile(userId),
                    getUserComments(userId)
                ])

                if (profileRes.error) throw profileRes.error
                if (commentsRes.error) throw commentsRes.error

                setProfile(profileRes.data)
                setComments(commentsRes.data || [])
            } catch (err) {
                console.error('Error fetching user profile:', err)
                setError('Gagal memuat profil pengguna.')
            } finally {
                setLoading(false)
            }
        }

        if (userId) {
            fetchUserData()
        }
    }, [userId])

    if (loading) {
        return (
            <div className="profile-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <Loader text="Memuat profil..." />
            </div>
        )
    }

    if (error || !profile) {
        return (
            <div className="profile-page">
                <div className="error-container" style={{ minHeight: '60vh' }}>
                    <div className="error-container__title">Profil tidak ditemukan</div>
                    <p className="error-container__message">{error || 'Pengguna ini belum pernah berkomentar atau tidak ditemukan.'}</p>
                    <button className="error-container__btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> Kembali
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="profile-page">
            <div className="container" style={{ paddingTop: 'var(--navbar-height)', paddingBottom: '80px' }}>
                <button
                    onClick={() => navigate(-1)}
                    className="watch-back-btn"
                    style={{ marginBottom: '24px' }}
                >
                    <ArrowLeft size={16} /> Kembali
                </button>

                <div className="user-profile-header">
                    <div className="user-profile-avatar">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.username} />
                        ) : (
                            <div className="navbar__avatar" style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                                {profile.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="user-profile-info">
                        <h1 className="user-profile-username">{profile.username}</h1>
                        <div className="user-profile-stats">
                            <div className="user-profile-stat">
                                <MessageSquare size={16} />
                                <span>{comments.length} Komentar</span>
                            </div>
                            <div className="user-profile-stat">
                                <Calendar size={16} />
                                <span>Bergabung {new Date(comments[comments.length - 1]?.created_at || Date.now()).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="user-profile-content">
                    <h2 className="detail__section-title">
                        <MessageSquare size={18} /> Aktivitas Terbaru
                    </h2>

                    {comments.length === 0 ? (
                        <p className="comments-empty">Belum ada aktivitas komentar.</p>
                    ) : (
                        <div className="comments-list">
                            {comments.map((comment, i) => (
                                <div key={comment.id} className="comment-item" style={{ animationDelay: `${i * 0.05}s` }}>
                                    <div className="comment-item__header">
                                        <div className="comment-item__user">
                                            <span className="comment-item__username" style={{ cursor: 'default' }}>{comment.username}</span>
                                            <span className="comment-item__date">
                                                {new Date(comment.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <Link
                                            to={`/anime/${comment.anime_id}`}
                                            className="comment-item__link"
                                            title="Lihat Anime"
                                        >
                                            <Play size={12} fill="currentColor" />
                                        </Link>
                                    </div>
                                    <p className="comment-item__content">{comment.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserProfile
