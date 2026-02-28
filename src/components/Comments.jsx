import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getComments, postComment, deleteComment } from '../services/comments';
import Loader from './Loader';

function Comments({ animeId }) {
    const { user, isAuthenticated } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const fetchComments = async () => {
        setLoading(true);
        const { data, error } = await getComments(animeId);
        if (!error) {
            setComments(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (animeId) {
            fetchComments();
        }
    }, [animeId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        if (!isAuthenticated) {
            alert('Silakan login untuk memberikan komentar.');
            return;
        }

        setSubmitting(true);
        const { error } = await postComment(user, animeId, newComment);
        if (error) {
            alert('Gagal mengirim komentar: ' + error.message);
        } else {
            setNewComment('');
            fetchComments();
        }
        setSubmitting(false);
    };

    const handleDelete = async (commentId) => {
        if (window.confirm('Hapus komentar ini?')) {
            const { error } = await deleteComment(user, commentId);
            if (!error) {
                setComments(prev => prev.filter(c => c.id !== commentId));
            }
        }
    };

    return (
        <div className="comments-section">
            <h3 className="detail__section-title">
                <MessageSquare size={18} />
                Komentar ({comments.length})
            </h3>

            {/* Post Comment */}
            <form className="comment-form" onSubmit={handleSubmit}>
                <div className="comment-form__avatar">
                    {isAuthenticated ? (
                        <div className="navbar__avatar" style={{ width: '40px', height: '40px' }}>
                            {(user.user_metadata?.username || user.email).charAt(0).toUpperCase()}
                        </div>
                    ) : (
                        <div className="comment-form__guest-icon"><User size={20} /></div>
                    )}
                </div>
                <div className="comment-form__input-wrap">
                    <textarea
                        className="comment-form__input"
                        placeholder={isAuthenticated ? "Tulis komentar kamu..." : "Login untuk berkomentar."}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={!isAuthenticated || submitting}
                    />
                    <button
                        type="submit"
                        className="comment-form__submit"
                        disabled={!isAuthenticated || !newComment.trim() || submitting}
                    >
                        {submitting ? <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> : <Send size={18} />}
                    </button>
                </div>
            </form>

            {/* Comments List */}
            {loading ? (
                <Loader text="Memuat komentar..." />
            ) : comments.length === 0 ? (
                <p className="comments-empty">Belum ada komentar. Jadilah yang pertama berkomentar!</p>
            ) : (
                <div className="comments-list">
                    {comments.map((comment, i) => (
                        <div key={comment.id} className="comment-item" style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className="comment-item__header">
                                <div className="comment-item__user">
                                    <div className="navbar__avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                                        {comment.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="comment-item__username">{comment.username}</span>
                                    <span className="comment-item__date">
                                        {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                {user && user.id === comment.user_id && (
                                    <button
                                        className="comment-item__delete"
                                        onClick={() => handleDelete(comment.id)}
                                        title="Hapus komentar"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <p className="comment-item__content">{comment.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Comments;
