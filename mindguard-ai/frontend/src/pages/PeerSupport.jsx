import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MessageSquare, AlertTriangle, Send, User, Clock, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:8000/peer-support';

const PeerSupport = () => {
    const { t } = useTranslation();
    const [topics, setTopics] = useState([]);
    const [activeTopic, setActiveTopic] = useState('All');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New Post State
    const [showNewPostForm, setShowNewPostForm] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostTopic, setNewPostTopic] = useState('General Support');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Distress Alert
    const [distressAlert, setDistressAlert] = useState(null);

    // View Post Details
    const [activePost, setActivePost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        fetchTopics();
    }, []);

    useEffect(() => {
        fetchPosts(activeTopic);
        setActivePost(null); // Reset detail view when changing topics
    }, [activeTopic]);

    const fetchTopics = async () => {
        try {
            const res = await axios.get(`${API_URL}/topics`);
            setTopics(res.data);
            if (res.data.length > 0 && !res.data.includes('All')) {
                setNewPostTopic(res.data[0]);
            }
        } catch (err) {
            console.error("Error fetching topics:", err);
        }
    };

    const fetchPosts = async (topic) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/posts/${encodeURIComponent(topic)}`);
            setPosts(res.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching posts:", err);
            setError("Failed to load discussions. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchPostDetails = async (postId) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/posts/detail/${postId}`);
            setActivePost(res.data.post);
            setComments(res.data.comments);
        } catch (err) {
            console.error("Error fetching post details:", err);
            setError("Failed to load post details.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setDistressAlert(null);

        try {
            const res = await axios.post(`${API_URL}/posts`, {
                title: newPostTitle,
                content: newPostContent,
                topic: newPostTopic,
                is_anonymous: isAnonymous
            });

            const newPost = res.data;

            // Check for distress flag
            if (newPost.flags && newPost.flags.includes("SEVERE_DISTRESS")) {
                setDistressAlert("Our AI moderator noticed you might be in severe distress. You are not alone. Please consider reaching out to a professional or helpline immediately.");
            }

            // Reset form and refresh list
            setNewPostTitle('');
            setNewPostContent('');
            setShowNewPostForm(false);
            fetchPosts(activeTopic);

        } catch (err) {
            console.error("Error creating post:", err);
            setError(err.response?.data?.detail || "Failed to create post. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        setError(null);

        try {
            await axios.post(`${API_URL}/comments/${activePost.id}`, {
                content: newComment,
                is_anonymous: isAnonymous
            });

            setNewComment('');
            // Refresh comments
            fetchPostDetails(activePost.id);
        } catch (err) {
            console.error("Error creating comment:", err);
            setError(err.response?.data?.detail || "Failed to post comment.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="dashboard-layout fade-in flex-mobile-col text-mobile-center">
            {/* Sidebar Topics */}
            <div className="dashboard-sidebar glass-panel">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={20} color="var(--primary)" />
                    {t('peerSupport.topics')}
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {topics.map(topic => (
                        <li key={topic}>
                            <button
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    background: activeTopic === topic ? 'rgba(78,205,196,0.1)' : 'transparent',
                                    border: activeTopic === topic ? '1px solid var(--primary)' : '1px solid transparent',
                                    color: activeTopic === topic ? 'var(--primary)' : 'var(--text-light)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setActiveTopic(topic)}
                            >
                                {topic}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Content */}
            <div className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Header Section */}
                <div className="glass-panel flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>{t('peerSupport.title')}: {activeTopic}</h1>
                        <p className="text-light" style={{ margin: '0.5rem 0 0 0' }}>{t('peerSupport.subtitle')}</p>
                    </div>
                    {!activePost && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowNewPostForm(!showNewPostForm)}
                        >
                            {showNewPostForm ? t('peerSupport.cancel') : t('peerSupport.newDiscussion')}
                        </button>
                    )}
                    {activePost && (
                        <button
                            className="btn btn-glass"
                            onClick={() => setActivePost(null)}
                        >
                            {t('peerSupport.back')}
                        </button>
                    )}
                </div>

                {/* Errors & Alerts */}
                {error && (
                    <div className="card" style={{ borderLeft: '4px solid var(--danger)', backgroundColor: 'rgba(255,107,107,0.05)' }}>
                        <p style={{ color: 'var(--danger)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={18} /> {error}
                        </p>
                    </div>
                )}

                {distressAlert && (
                    <div className="card" style={{ borderLeft: '4px solid var(--danger)', backgroundColor: 'rgba(255,107,107,0.1)' }}>
                        <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
                            <ShieldAlert size={20} /> {t('peerSupport.alerts.aiSafetyAlert')}
                        </h3>
                        <p style={{ color: 'var(--text-light)' }}>{distressAlert}</p>
                        <a href="/counseling" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>{t('peerSupport.alerts.seekHelp')}</a>
                    </div>
                )}

                {/* New Post Form */}
                {showNewPostForm && !activePost && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel"
                    >
                        <h3 style={{ marginTop: 0, color: 'var(--primary)' }}>{t('peerSupport.form.startDiscussion')}</h3>
                        <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            <div>
                                <label className="text-light" style={{ display: 'block', marginBottom: '0.5rem' }}>{t('peerSupport.form.title')}</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={newPostTitle}
                                    onChange={(e) => setNewPostTitle(e.target.value)}
                                    placeholder={t('peerSupport.form.titlePlaceholder')}
                                    required
                                />
                            </div>

                            <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="text-light" style={{ display: 'block', marginBottom: '0.5rem' }}>{t('peerSupport.form.topic')}</label>
                                    <select
                                        className="input-field"
                                        value={newPostTopic}
                                        onChange={(e) => setNewPostTopic(e.target.value)}
                                    >
                                        {topics.filter(t => t !== 'All').map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-light" style={{ display: 'block', marginBottom: '0.5rem' }}>{t('peerSupport.form.identity')}</label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                        <input
                                            type="checkbox"
                                            checked={isAnonymous}
                                            onChange={(e) => setIsAnonymous(e.target.checked)}
                                            style={{ accentColor: 'var(--primary)', width: '20px', height: '20px' }}
                                        />
                                        <span className="text-light">{t('peerSupport.form.postAnonymously')}</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-light" style={{ display: 'block', marginBottom: '0.5rem' }}>{t('peerSupport.form.content')}</label>
                                <textarea
                                    className="input-field"
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder={t('peerSupport.form.contentPlaceholder')}
                                    rows="5"
                                    required
                                ></textarea>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {submitting ? t('peerSupport.form.posting') : <><Send size={18} /> {t('peerSupport.form.post')}</>}
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Post List View */}
                {!activePost && !loading && posts.length > 0 && (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {posts.map(post => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.01 }}
                                className="card stat-card"
                                onClick={() => fetchPostDetails(post.id)}
                                style={{ cursor: 'pointer', padding: '1.5rem' }}
                            >
                                <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '0.5rem' }}>
                                    <h3 style={{ margin: 0, color: 'var(--text-light)', fontSize: '1.25rem' }}>{post.title}</h3>
                                    <span className="badge" style={{ background: 'rgba(78,205,196,0.1)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                                        {post.topic}
                                    </span>
                                </div>

                                <p className="text-light" style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '1.5rem' }}>
                                    {post.content}
                                </p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {post.is_anonymous ? <User size={16} /> : <User size={16} color="var(--primary)" />}
                                        <span>{post.is_anonymous ? 'Anonymous' : 'Peer'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={16} />
                                        <span>{formatDate(post.created_at)}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {!activePost && !loading && posts.length === 0 && (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <MessageSquare size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 className="text-light">{t('peerSupport.noDiscussions')}</h3>
                        <p className="text-muted">{t('peerSupport.beTheFirst')}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <div className="loading-spinner"></div>
                    </div>
                )}

                {/* Detailed Post View */}
                {activePost && !loading && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                    >
                        {/* Original Post */}
                        <div className="glass-panel">
                            <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '0.5rem' }}>
                                <h2 style={{ margin: 0, color: 'var(--primary)' }}>{activePost.title}</h2>
                                <span className="badge" style={{ background: 'rgba(78,205,196,0.1)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                                    {activePost.topic}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={16} />
                                    <span>{activePost.is_anonymous ? 'Anonymous' : 'Peer'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={16} />
                                    <span>{formatDate(activePost.created_at)}</span>
                                </div>
                            </div>

                            <p className="text-light" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1.1rem' }}>
                                {activePost.content}
                            </p>
                        </div>

                        {/* Comments Section */}
                        <div>
                            <h3 style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>{t('peerSupport.postDetails.replies')} ({comments.length})</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                {comments.map(comment => (
                                    <div key={comment.id} className="card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--glass-border)' }}>
                                        <p className="text-light" style={{ whiteSpace: 'pre-wrap', marginTop: 0, marginBottom: '1rem', lineHeight: '1.5' }}>
                                            {comment.content}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <User size={14} />
                                                <span>{comment.is_anonymous ? 'Anonymous' : 'Peer'}</span>
                                            </div>
                                            <span>{formatDate(comment.created_at)}</span>
                                        </div>
                                    </div>
                                ))}

                                {comments.length === 0 && (
                                    <p className="text-muted" style={{ fontStyle: 'italic' }}>{t('peerSupport.postDetails.noReplies')}</p>
                                )}
                            </div>

                            {/* Add Comment Form */}
                            <div className="glass-panel" style={{ background: 'rgba(108, 92, 231, 0.05)', border: '1px solid rgba(108, 92, 231, 0.2)' }}>
                                <h4 style={{ marginTop: 0, color: 'var(--secondary)' }}>{t('peerSupport.postDetails.addReply')}</h4>
                                <form onSubmit={handleCreateComment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <textarea
                                        className="input-field"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={t('peerSupport.postDetails.replyPlaceholder')}
                                        rows="3"
                                        required
                                    ></textarea>

                                    <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={isAnonymous}
                                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                                style={{ accentColor: 'var(--secondary)' }}
                                            />
                                            <span className="text-light" style={{ fontSize: '0.9rem' }}>{t('peerSupport.postDetails.replyAnonymously')}</span>
                                        </label>

                                        <button type="submit" className="btn btn-secondary" disabled={submitting || !newComment.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {submitting ? t('peerSupport.form.posting') : <><Send size={16} /> {t('peerSupport.postDetails.reply')}</>}
                                        </button>
                                    </div>
                                </form>
                            </div>

                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
};

export default PeerSupport;
