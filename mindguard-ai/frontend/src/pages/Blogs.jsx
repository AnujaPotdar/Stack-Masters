import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BookOpen, AlertTriangle, Send, User, Clock, ShieldAlert, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:8000/blogs';

const Blogs = () => {
    const { t } = useTranslation();
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New Post State
    const [showNewPostForm, setShowNewPostForm] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostCategory, setNewPostCategory] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Distress Alert
    const [distressAlert, setDistressAlert] = useState(null);

    // View Post Details
    const [activePost, setActivePost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (categories.length > 0) {
            fetchPosts(activeCategory);
            setActivePost(null);
        }
    }, [activeCategory, categories]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${API_URL}/categories`);
            setCategories(res.data);
            if (res.data.length > 0) {
                const defaultCat = res.data.find(c => c !== 'All') || res.data[0];
                setNewPostCategory(defaultCat);
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
            // Fallback categories if backend unavailable during dev
            setCategories(["All", "Stress Management", "Anxiety Coping", "Motivation", "Academic Pressure", "General Wellness"]);
            setNewPostCategory("Stress Management");
        }
    };

    const fetchPosts = async (category) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/${encodeURIComponent(category)}`);
            setPosts(res.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching posts:", err);
            setError("Failed to load blogs. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchPostDetails = async (postId) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/detail/${postId}`);
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
            const token = sessionStorage.getItem('token');
            const res = await axios.post(`${API_URL}/`, {
                title: newPostTitle,
                content: newPostContent,
                category: newPostCategory,
                is_anonymous: isAnonymous
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const newPost = res.data;

            if (newPost.flags && newPost.flags.includes("SEVERE_DISTRESS")) {
                setDistressAlert("Our AI moderator noticed you might be experiencing severe distress. Please consider reaching out to a professional or helpline immediately.");
            }

            setNewPostTitle('');
            setNewPostContent('');
            setShowNewPostForm(false);
            fetchPosts(activeCategory);

        } catch (err) {
            console.error("Error creating post:", err);
            setError(err.response?.data?.detail || "Failed to publish blog post. Please try again.");
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
            const token = sessionStorage.getItem('token');
            await axios.post(`${API_URL}/comments/${activePost.id}`, {
                content: newComment,
                is_anonymous: isAnonymous
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setNewComment('');
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
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="dashboard-layout fade-in flex-mobile-col text-mobile-center" style={{ marginTop: '2rem' }}>
            {/* Sidebar Categories */}
            <div className="dashboard-sidebar glass-panel">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={20} color="var(--primary)" />
                    Categories
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {categories.map(category => (
                        <li key={category}>
                            <button
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    background: activeCategory === category ? 'rgba(108,140,255,0.1)' : 'transparent',
                                    border: activeCategory === category ? '1px solid var(--primary)' : '1px solid transparent',
                                    color: activeCategory === category ? 'var(--primary)' : 'var(--text-main)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontWeight: activeCategory === category ? '600' : '400'
                                }}
                                onClick={() => setActiveCategory(category)}
                            >
                                {category}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Content */}
            <div className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Header Section */}
                <div className="glass-panel flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1.5rem 2rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {activePost ? (
                                <>
                                    <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setActivePost(null)}>Blog</span>
                                    <ChevronRight size={20} color="var(--text-muted)" />
                                    <span style={{ color: 'var(--primary)' }}>Read</span>
                                </>
                            ) : (
                                <>Peer Support Blog</>
                            )}
                        </h1>
                        <p className="text-muted" style={{ margin: '0.5rem 0 0 0' }}>
                            {activePost ? "Community stories and coping strategies" : `Exploring: ${activeCategory}`}
                        </p>
                    </div>
                    {!activePost && (
                        <button
                            className={`btn ${showNewPostForm ? 'btn-glass' : 'btn-primary'}`}
                            onClick={() => setShowNewPostForm(!showNewPostForm)}
                        >
                            {showNewPostForm ? 'Cancel' : 'Write a Blog'}
                        </button>
                    )}
                    {activePost && (
                        <button
                            className="btn btn-glass"
                            onClick={() => setActivePost(null)}
                        >
                            Back to Stories
                        </button>
                    )}
                </div>

                {/* Errors & Alerts */}
                {error && (
                    <div className="card" style={{ borderLeft: '4px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '1rem' }}>
                        <p style={{ color: 'var(--danger)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={18} /> {error}
                        </p>
                    </div>
                )}

                {distressAlert && (
                    <div className="card" style={{ borderLeft: '4px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem' }}>
                        <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
                            <ShieldAlert size={20} /> AI Safety Alert
                        </h3>
                        <p style={{ color: 'var(--text-main)', marginBottom: 0 }}>{distressAlert}</p>
                        <a href="/counseling" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Seek Professional Help</a>
                    </div>
                )}

                {/* New Post Form */}
                {showNewPostForm && !activePost && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel"
                        style={{ padding: '2rem' }}
                    >
                        <h3 style={{ marginTop: 0, color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Share Your Experience</h3>
                        <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            <div>
                                <label className="text-main" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Blog Title</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={newPostTitle}
                                    onChange={(e) => setNewPostTitle(e.target.value)}
                                    placeholder="Give your story a meaningful title..."
                                    required
                                />
                            </div>

                            <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label className="text-main" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Category</label>
                                    <select
                                        className="input-field"
                                        value={newPostCategory}
                                        onChange={(e) => setNewPostCategory(e.target.value)}
                                    >
                                        {categories.filter(c => c !== 'All').map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-main" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Identity</label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                        <input
                                            type="checkbox"
                                            checked={isAnonymous}
                                            onChange={(e) => setIsAnonymous(e.target.checked)}
                                            style={{ accentColor: 'var(--primary)', width: '20px', height: '20px' }}
                                        />
                                        <span className="text-main">Publish Anonymously</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-main" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Your Story / Advice</label>
                                <textarea
                                    className="input-field"
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder="Write your experiences, coping strategies, or tips here to help others..."
                                    rows="8"
                                    required
                                ></textarea>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
                                {submitting ? 'Publishing...' : <><Send size={18} /> Publish Blog</>}
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Post List View */}
                {!activePost && !loading && posts.length > 0 && (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {posts.map(post => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.01, boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }}
                                className="glass-panel hover-grow"
                                onClick={() => fetchPostDetails(post.id)}
                                style={{ cursor: 'pointer', padding: '2rem', transition: 'all 0.2s', borderLeft: '4px solid var(--secondary)' }}
                            >
                                <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem', lineHeight: '1.3' }}>{post.title}</h3>
                                    <span style={{ background: 'rgba(108,140,255,0.1)', color: 'var(--primary)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                        {post.category}
                                    </span>
                                </div>

                                <p className="text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: '2rem', lineHeight: '1.6', fontSize: '1.05rem' }}>
                                    {post.content}
                                </p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <User size={18} color="var(--primary)" />
                                        <span style={{ fontWeight: 500 }}>{post.author_name || (post.is_anonymous ? 'Anonymous' : 'Peer')}</span>
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
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                        <BookOpen size={64} color="var(--primary)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No blogs found in this category</h3>
                        <p className="text-muted">Be the first to share your experience and guide others!</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
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
                        <div className="glass-panel" style={{ padding: '2.5rem' }}>
                            <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
                                <h1 style={{ margin: 0, color: 'var(--primary)', fontSize: '2.2rem', lineHeight: '1.2' }}>{activePost.title}</h1>
                                <span style={{ background: 'rgba(108,140,255,0.1)', color: 'var(--primary)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 500 }}>
                                    {activePost.category}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {(activePost.author_name || (activePost.is_anonymous ? 'A' : 'P')).charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{activePost.author_name || (activePost.is_anonymous ? 'Anonymous' : 'Peer')}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={16} />
                                    <span>{formatDate(activePost.created_at)}</span>
                                </div>
                            </div>

                            <div className="text-main" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.15rem' }}>
                                {activePost.content}
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div style={{ padding: '0 1rem' }}>
                            <h3 style={{ color: 'var(--text-main)', marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Comments <span style={{ background: 'var(--glass-border)', padding: '0.2rem 0.8rem', borderRadius: '20px', fontSize: '1rem', color: 'var(--text-muted)' }}>{comments.length}</span>
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
                                {comments.map(comment => (
                                    <div key={comment.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid var(--secondary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <User size={16} color="var(--secondary)" />
                                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{comment.author_name || (comment.is_anonymous ? 'Anonymous' : 'Peer')}</span>
                                            </div>
                                            <span>{formatDate(comment.created_at)}</span>
                                        </div>
                                        <p className="text-main" style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: '1.6', fontSize: '1.05rem' }}>
                                            {comment.content}
                                        </p>
                                    </div>
                                ))}

                                {comments.length === 0 && (
                                    <p className="text-muted" style={{ fontStyle: 'italic', background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>No comments yet. Be the first to share your thoughts!</p>
                                )}
                            </div>

                            {/* Add Comment Form */}
                            <div className="glass-panel" style={{ padding: '2rem', background: '#f8fafc', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ marginTop: 0, color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>Leave a Comment</h4>
                                <form onSubmit={handleCreateComment} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <textarea
                                        className="input-field"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add to the conversation..."
                                        rows="4"
                                        required
                                        style={{ background: '#ffffff' }}
                                    ></textarea>

                                    <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={isAnonymous}
                                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                                style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                                            />
                                            <span className="text-main" style={{ fontWeight: 500 }}>Comment Anonymously</span>
                                        </label>

                                        <button type="submit" className="btn btn-secondary" disabled={submitting || !newComment.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}>
                                            {submitting ? 'Posting...' : <><Send size={16} /> Post Comment</>}
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

export default Blogs;
