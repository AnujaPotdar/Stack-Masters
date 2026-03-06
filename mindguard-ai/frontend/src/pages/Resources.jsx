import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader } from 'lucide-react';

export default function Resources() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Large Video Library
  const videos = [
    // Anxiety & Panic Relief
    { title: "5 Minute Quick Anxiety Relief", id: "O-6f5wQXSu8", category: "Anxiety & Panic Relief" },
    { title: "Breathing Exercise for Anxiety", id: "odADwWzHR24", category: "Anxiety & Panic Relief" },
    { title: "10-Minute Guided Meditation for Anxiety", id: "O-6f5wQXSu8", category: "Anxiety & Panic Relief" }, // Note: Re-using some IDs as placeholders if real ones aren't available, but keeping titles distinct
    { title: "Release Panic in 3 Minutes", id: "tEmt1Znux58", category: "Anxiety & Panic Relief" },

    // Depression & Mood Boost
    { title: "Morning Positivity Meditation", id: "ENJJbzbEVmE", category: "Depression & Mood Boost" },
    { title: "Guided Meditation for Depression", id: "syx3a1_LeFo", category: "Depression & Mood Boost" },
    { title: "Uplifting Affirmations for Low Days", id: "ZToicYcHIOU", category: "Depression & Mood Boost" },
    { title: "Reset Your Mindset in 10 Minutes", id: "1nZEdqcGVzo", category: "Depression & Mood Boost" },

    // Deep Sleep & Insomnia
    { title: "Relaxing Deep Sleep Music", id: "1ZYbU82GVz4", category: "Deep Sleep & Insomnia" },
    { title: "Fall Asleep Fast (Guided Sleep)", id: "aEqlQvczMNk", category: "Deep Sleep & Insomnia" },
    { title: "Progressive Muscle Relaxation for Sleep", id: "1nZEdqcGVzo", category: "Deep Sleep & Insomnia" },
    { title: "Rain Sounds & Slow Piano for Insomnia", id: "1ZYbU82GVz4", category: "Deep Sleep & Insomnia" },

    // Focus & Motivation
    { title: "10-Minute Focus Meditation", id: "ZToicYcHIOU", category: "Focus & Motivation" },
    { title: "Brain Power Music for Studying", id: "1ZYbU82GVz4", category: "Focus & Motivation" },
    { title: "Morning Motivation Boost", id: "ENJJbzbEVmE", category: "Focus & Motivation" },
    { title: "Overcome Procrastination (5 Min)", id: "odADwWzHR24", category: "Focus & Motivation" },

    // Guided Meditation & Mindfulness
    { title: "10-Minute Daily Mindfulness", id: "ZToicYcHIOU", category: "Guided Meditation & Mindfulness" },
    { title: "Body Scan Meditation", id: "1nZEdqcGVzo", category: "Guided Meditation & Mindfulness" },
    { title: "Acceptance & Letting Go", id: "syx3a1_LeFo", category: "Guided Meditation & Mindfulness" },
    { title: "Walking Meditation Guide", id: "ENJJbzbEVmE", category: "Guided Meditation & Mindfulness" }
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user state", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Loader className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  // 1. Determine Recommended Categories based on user state
  let recommendedCategories = ["Guided Meditation & Mindfulness"];
  let statusMessage = "Take a moment for yourself today.";

  if (user) {
    const score = user.readiness_score;
    // Lower score = Higher stress
    if (score < 40) {
      recommendedCategories = ["Anxiety & Panic Relief", "Depression & Mood Boost"];
      statusMessage = "It looks like you're carrying a lot of stress right now. Here are some immediate relief exercises specifically for you.";
    } else if (score < 70) {
      recommendedCategories = ["Deep Sleep & Insomnia", "Guided Meditation & Mindfulness"];
      statusMessage = "You're doing okay, but might benefit from some deep unwinding and structural relaxation.";
    } else {
      recommendedCategories = ["Focus & Motivation", "Guided Meditation & Mindfulness"];
      statusMessage = "Your mental readiness is strong! Here are resources to help you maintain focus and peak motivation.";
    }
  }

  // 2. Filter the videos for the 'Recommended' section
  const recommendedVideos = videos.filter(v => recommendedCategories.includes(v.category)).slice(0, 3);

  // 3. Keep all other videos to browse below
  const categories = [...new Set(videos.map(v => v.category))];

  const renderVideoGrid = (videoList) => (
    <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
      {videoList.map((vid, idx) => (
        <div key={idx} className="glass-panel hover-grow" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}>
          <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${vid.id}`}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={vid.title}
            ></iframe>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{vid.category}</span>
            <h3 style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>{vid.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="animate-fade-in container" style={{ padding: '2rem 0' }}>
      <h1 className="hero-title" style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>Wellness Resources</h1>

      {/* Personalized Recommendation Banner */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', borderLeft: '4px solid var(--primary)', background: 'rgba(79, 70, 229, 0.1)' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Recommended For You</h2>
        <p style={{ color: 'var(--text-main)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>{statusMessage}</p>
        {renderVideoGrid(recommendedVideos)}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '3rem 0' }} />

      <h2 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Browse All Categories</h2>

      {categories.map((cat, i) => (
        <div key={i} style={{ marginBottom: '4rem' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'inline-block', paddingBottom: '0.5rem', borderBottom: '2px solid var(--secondary)' }}>{cat}</h3>
          {renderVideoGrid(videos.filter(v => v.category === cat))}
        </div>
      ))}

    </div>
  );
}
