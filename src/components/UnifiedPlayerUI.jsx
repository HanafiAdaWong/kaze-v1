import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Maximize2, Monitor, Download, Info, Video, List } from 'lucide-react';
import Loader from './Loader';

export default function UnifiedPlayerUI({
    title,
    streamUrl,
    playerLoading,
    serverError,
    servers = [],
    qualities = [],
    onServerClick,
    prevEpUrl,
    nextEpUrl,
    metadata = {},
    genres = [],
    animeData = {},
    episodesList = [],
    downloadUrl,
    onFullscreen,
    playerNode
}) {
    return (
        <div className="unified-player-page">
            <div className="unified-player-container">
                
                {/* Main Content (Left) */}
                <div className="unified-player-main">
                    {/* Video Player Box */}
                    <div className="unified-video-box">
                        {playerLoading && (
                            <div className="player-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', zIndex: 10 }}>
                                <Loader text="Menghubungkan ke server..." />
                            </div>
                        )}
                        {serverError && (
                            <div className="player-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', zIndex: 10 }}>
                                <div className="error-container" style={{ minHeight: 'auto', padding: '20px' }}>
                                    <p className="error-container__message" style={{ margin: 0 }}>{serverError}</p>
                                </div>
                            </div>
                        )}
                        {!playerLoading && !serverError ? (
                            playerNode ? playerNode : (
                                streamUrl ? (
                                    <iframe
                                        id="player-iframe"
                                        src={streamUrl}
                                        title={title}
                                        allowFullScreen
                                        allow="autoplay; fullscreen; encrypted-media"
                                        className="unified-video-iframe"
                                    />
                                ) : (
                                    <div className="player-placeholder" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
                                        <p>Silakan pilih server video di bawah.</p>
                                    </div>
                                )
                            )
                        ) : null}
                    </div>

                    {/* Server Controls Bar */}
                    <div className="unified-controls-bar">
                        {prevEpUrl ? (
                            <Link to={prevEpUrl} className="unified-btn">
                                <ChevronLeft size={16} /> Episode Seb
                            </Link>
                        ) : (
                            <div className="unified-btn disabled">
                                <ChevronLeft size={16} /> Episode Seb
                            </div>
                        )}

                        <div className="unified-server-list">
                            <span style={{ fontSize: '0.85rem', color: '#9ca3af', marginRight: '8px' }}>Server:</span>
                            {servers.map((s, i) => (
                                <button
                                    key={i}
                                    className={`unified-btn ${s.isActive ? 'unified-btn--active' : ''}`}
                                    onClick={() => onServerClick(s.id)}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>

                        {nextEpUrl ? (
                            <Link to={nextEpUrl} className="unified-btn">
                                Episode Sel <ChevronRight size={16} />
                            </Link>
                        ) : (
                            <div className="unified-btn disabled">
                                Episode Sel <ChevronRight size={16} />
                            </div>
                        )}
                    </div>

                    {/* Episode Info */}
                    <div className="unified-info-box">
                        <h1 className="unified-info-title">{title}</h1>
                        <div className="unified-info-meta">
                            {metadata.duration && (
                                <span><Monitor size={14} /> Duration: {metadata.duration}</span>
                            )}

                            {metadata.quality && (
                                <span><Video size={14} /> Quality: {metadata.quality}</span>
                            )}
                        </div>
                        {genres.length > 0 && (
                            <div className="unified-info-genres">
                                {genres.map((g, i) => (
                                    <span key={i} className="unified-genre-badge">{g}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Download Accordion (Optional) */}
                    {downloadUrl && (
                        <div className="unified-sidebar-box" style={{ marginTop: '16px', padding: '16px 24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 600 }}>
                                    <Download size={18} /> Link Download
                                </span>
                                <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="unified-btn unified-btn--primary">
                                    Download
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar (Right) */}
                <div className="unified-player-sidebar">
                    
                    {/* Anime Details Box */}
                    {animeData.title && (
                        <div className="unified-sidebar-box">
                            <div className="unified-anime-card">
                                {animeData.poster && (
                                    <img src={animeData.poster} alt={animeData.title} className="unified-anime-poster" />
                                )}
                                <div className="unified-anime-details">
                                    <h3 className="unified-anime-title">{animeData.title}</h3>
                                    {animeData.score && (
                                        <div className="unified-anime-stat">Score: <span>★ {animeData.score}</span></div>
                                    )}
                                    {animeData.status && (
                                        <div className="unified-anime-stat">Status: {animeData.status}</div>
                                    )}
                                    {animeData.detailUrl && (
                                        <Link to={animeData.detailUrl} className="unified-btn" style={{ marginTop: '8px', padding: '6px 12px', fontSize: '0.8rem' }}>
                                            Detail Utama
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Qualities / Servers (for Samehadaku) */}
                    {qualities && qualities.length > 0 && (
                        <div className="unified-sidebar-box">
                            <h3 className="unified-sidebar-title"><Video size={18} /> Kualitas</h3>
                            {qualities.map((q, qIdx) => (
                                <div key={qIdx} style={{ marginBottom: qIdx === qualities.length - 1 ? 0 : '16px' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        {q.title}
                                    </div>
                                    <div className="unified-server-list" style={{ justifyContent: 'flex-start' }}>
                                        {q.servers?.map((server, sIdx) => (
                                            <button
                                                key={sIdx}
                                                className={`unified-btn ${server.isActive ? 'unified-btn--active' : ''}`}
                                                onClick={() => onServerClick(server.id)}
                                            >
                                                {server.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* All Episodes */}
                    {episodesList && episodesList.length > 0 && (
                        <div className="unified-sidebar-box">
                            <h3 className="unified-sidebar-title"><List size={18} /> Semua Episode</h3>
                            <div className="unified-ep-list">
                                {episodesList.map((ep, i) => (
                                    <Link 
                                        key={i} 
                                        to={ep.url} 
                                        className={`unified-ep-item ${ep.isActive ? 'active' : ''}`}
                                    >
                                        {ep.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
