import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Screening from './pages/Screening';
import Login from './pages/Login';
import Register from './pages/Register';
import Resources from './pages/Resources';
import Counseling from './pages/Counseling';
import DefenceDashboard from './pages/DefenceDashboard';
import CollegeAdminDKTE from './pages/CollegeAdminDKTE';
import CollegeAdminSharad from './pages/CollegeAdminSharad';
import Chatbot from './components/Chatbot';
import ProfilePopover from './components/ProfilePopover';
import PeerSupport from './pages/PeerSupport';
import Blogs from './pages/Blogs';
import { Activity, Globe, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

// Automatically attach token to all axios requests if it exists
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Redirect to login if token is invalid or expired
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userRole');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

function App() {
  const { t, i18n } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!sessionStorage.getItem('token'));
  const [userRole, setUserRole] = useState(() => sessionStorage.getItem('userRole') || 'user');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  // Ensure auth state is updated if token is manually removed
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!sessionStorage.getItem('token'));
      setUserRole(sessionStorage.getItem('userRole') || 'user');
    };
    window.addEventListener('storage', checkAuth);
    // Also trigger on mount to be absolutely sure
    checkAuth();
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole('user');
  };

  return (
    <Router>
      <nav className="nav-bar glass-panel">
        <Link to="/" className="nav-logo">
          <Activity size={28} color="var(--primary)" />
          <span>MindGuard AI</span>
        </Link>

        {isAuthenticated && (
          <>
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
              {userRole === 'user' || userRole === 'student' || userRole === 'adult' ? (
                <>
                  <Link to="/resources" className="btn btn-glass">{t('nav.resources')}</Link>
                  <Link to="/counseling" className="btn btn-glass">{t('nav.counseling')}</Link>
                  <Link to="/dashboard" className="btn btn-glass">{t('nav.dashboard')}</Link>
                  <Link to="/peer-support" className="btn btn-glass">{t('nav.peerSupport')}</Link>
                  <Link to="/blogs" className="btn btn-glass">Blogs</Link>
                </>
              ) : null}

              {userRole === 'soldier' && (
                <Link to="/defence-dashboard" className="btn btn-glass" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                  {t('nav.defenceDashboard')}
                </Link>
              )}

              {userRole === 'college_admin_dkte' && (
                <Link to="/admin/dkte" className="btn btn-glass" style={{ borderColor: 'var(--primary)' }}>DKTE Admin</Link>
              )}

              {userRole === 'college_admin_sharad' && (
                <Link to="/admin/sharad" className="btn btn-glass" style={{ borderColor: 'var(--primary)' }}>Sharad Admin</Link>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem', background: 'rgba(0,0,0,0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
                <Globe size={18} color="var(--text-main)" />
                <select
                  value={i18n.language.split('-')[0]}
                  onChange={handleLanguageChange}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' }}
                >
                  <option value="en" style={{ color: '#333' }}>English</option>
                  <option value="hi" style={{ color: '#333' }}>हिंदी</option>
                  <option value="mr" style={{ color: '#333' }}>मराठी</option>
                </select>
              </div>

              <ProfilePopover userRole={userRole} handleLogout={handleLogout} />
            </div>
          </>
        )}
      </nav>

      <main className="container">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login setAuth={setIsAuthenticated} />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />

          {/* Protected Routes */}
          <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/defence-dashboard" element={(isAuthenticated && userRole === 'soldier') ? <DefenceDashboard /> : <Navigate to="/dashboard" />} />
          <Route path="/screening" element={isAuthenticated ? <Screening /> : <Navigate to="/login" />} />
          <Route path="/resources" element={isAuthenticated ? <Resources /> : <Navigate to="/login" />} />
          <Route path="/counseling" element={isAuthenticated ? <Counseling /> : <Navigate to="/login" />} />
          <Route path="/peer-support" element={isAuthenticated ? <PeerSupport /> : <Navigate to="/login" />} />
          <Route path="/blogs" element={isAuthenticated ? <Blogs /> : <Navigate to="/login" />} />
          <Route path="/admin/dkte" element={isAuthenticated && userRole === 'college_admin_dkte' ? <CollegeAdminDKTE /> : <Navigate to="/" />} />
          <Route path="/admin/sharad" element={isAuthenticated && userRole === 'college_admin_sharad' ? <CollegeAdminSharad /> : <Navigate to="/" />} />
        </Routes>
      </main>

      {/* Only show chatbot if authenticated */}
      {isAuthenticated && <Chatbot />}
    </Router>
  );
}

export default App;
