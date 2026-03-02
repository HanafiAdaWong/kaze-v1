import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, User as UserIcon, Reply, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getComments, postComment, deleteComment, getReplies, toggleLike, checkUserLiked } from '../services/comments';
import { Link } from 'react-router-dom';
import Loader from './Loader';
import LevelBadge from './LevelBadge';

function CommentItem({ comment, animeId, user, onCommentDeleted }) {
    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(comment.likes_count || 0);

    // Track local reply count to show immediately after posting
    const [localReplyCount, setLocalReplyCount] = useState(comment.reply_count || 0);

    useEffect(() => {
        if (user && comment.id) {
            checkUserLiked(user.id, comment.id).then(setIsLiked);
        }
    }, [user, comment.id]);

    const handleLike = async () => {
        if (!user) {
            alert('Silakan login untuk menyukai komentar.');
            return;
        }

        const { liked, error } = await toggleLike(user.id, comment.id);
        if (!error) {
            setIsLiked(liked);
            setLikesCount(prev => liked ? prev + 1 : prev - 1);
        }
    };

    const fetchReplies = async () => {
        setLoadingReplies(true);
        const { data, error } = await getReplies(comment.id);
        if (!error) {
            setReplies(data || []);
            setLocalReplyCount(data?.length || 0);
        }
        setLoadingReplies(false);
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim() || submittingReply) return;

        setSubmittingReply(true);
        const { data, error } = await postComment(user, animeId, replyContent, comment.id, comment.username);
        if (error) {
            alert('Gagal mengirim balasan: ' + error.message);
        } else {
            setReplyContent('');
            setIsReplying(false);
            setShowReplies(true); // Always expand to show the fresh reply
            fetchReplies();
        }
        setSubmittingReply(false);
    };

    const toggleReplies = () => {
        if (!showReplies && (localReplyCount > 0 || replies.length > 0)) {
            fetchReplies();
        }
        setShowReplies(!showReplies);
    };

    const handleDelete = async (commentId) => {
        if (window.confirm('Hapus komentar ini?')) {
            const { error } = await deleteComment(user, commentId);
            if (!error) {
                onCommentDeleted(commentId);
            }
        }
    };

    return (
        <div className="comment-item-wrap">
            <div className="comment-item">
                <div className="comment-item__header">
                    <div className="comment-item__user">
                        <Link to={`/user/${comment.user_id}`} className="comment-item__avatar-link">
                            {comment.avatar_url ? (
                                <img src={comment.avatar_url} alt={comment.username} className="navbar__avatar" style={{ width: '32px', height: '32px' }} />
                            ) : (
                                <div className="navbar__avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                                    {comment.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </Link>
                        <Link to={`/user/${comment.user_id}`} className="comment-item__username">
                            {comment.username}
                        </Link>
                        <LevelBadge xp={comment.xp} size="sm" />
                        <span className="comment-item__date">
                            {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                        {comment.reply_to_username && (
                            <span className="comment-item__reply-to">
                                <Reply size={10} style={{ transform: 'rotate(180deg)', marginRight: '2px' }} />
                                membalas <span>@{comment.reply_to_username}</span>
                            </span>
                        )}
                    </div>
                    <div className="comment-item__actions">
                        <button
                            className={`comment-item__like-btn ${isLiked ? 'comment-item__like-btn--active' : ''}`}
                            onClick={handleLike}
                            title={isLiked ? "Batal Suka" : "Suka"}
                        >
                            <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                            {likesCount > 0 && <span>{likesCount}</span>}
                        </button>
                        {user && (
                            <button
                                className="comment-item__reply-btn"
                                onClick={() => setIsReplying(!isReplying)}
                                title="Balas"
                            >
                                <Reply size={14} />
                            </button>
                        )}
                        {user && user.id === comment.user_id && (
                            <button
                                className="comment-item__delete"
                                onClick={() => handleDelete(comment.id)}
                                title="Hapus"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
                <p className="comment-item__content">{comment.content}</p>

                {(localReplyCount > 0 || replies.length > 0) && !showReplies && (
                    <button className="comment-item__view-replies" onClick={toggleReplies}>
                        <ChevronDown size={14} /> Lihat {localReplyCount} balasan
                    </button>
                )}
            </div>

            {isReplying && (
                <form className="comment-form comment-form--reply" onSubmit={handleReplySubmit}>
                    <div className="comment-form__input-wrap">
                        <textarea
                            className="comment-form__input"
                            placeholder="Tulis balasan kamu..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="comment-form__submit" disabled={!replyContent.trim() || submittingReply}>
                            {submittingReply ? <div className="loader loader--small" /> : <Send size={16} />}
                        </button>
                    </div>
                </form>
            )}

            {showReplies && (
                <div className="comment-replies">
                    <button className="comment-item__hide-replies" onClick={() => setShowReplies(false)}>
                        <ChevronUp size={14} /> Sembunyikan balasan
                    </button>
                    {loadingReplies ? (
                        <div style={{ padding: '10px' }}><Loader text="" /></div>
                    ) : (
                        replies.map(reply => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                animeId={animeId}
                                user={user}
                                onCommentDeleted={() => fetchReplies()}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function Comments({ animeId }) {
    const { user, isAuthenticated } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

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
                        user.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="You" className="navbar__avatar" style={{ width: '40px', height: '40px' }} />
                        ) : (
                            <div className="navbar__avatar" style={{ width: '40px', height: '40px' }}>
                                {(user.user_metadata?.username || user.email).charAt(0).toUpperCase()}
                            </div>
                        )
                    ) : (
                        <div className="comment-form__guest-icon"><UserIcon size={20} /></div>
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
                        {submitting ? <div className="loader loader--small" /> : <Send size={18} />}
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
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            animeId={animeId}
                            user={user}
                            onCommentDeleted={(id) => setComments(prev => prev.filter(c => c.id !== id))}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Comments;
