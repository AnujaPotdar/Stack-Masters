import { Link, useNavigate } from 'react-router-dom';
import { Shield, Brain, Activity } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Home = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const rawRole = sessionStorage.getItem('userRole') || 'student';

    let displayRole = 'Student';
    if (rawRole === 'soldier') displayRole = 'Soldier';
    if (rawRole === 'adult') displayRole = 'Adult';
    if (rawRole === 'user') displayRole = 'User';

    useEffect(() => {
        const role = sessionStorage.getItem('userRole');
        const currentPath = window.location.pathname;

        // ONLY redirect if the user is literally sitting on the root home page
        if (currentPath === '/') {
            if (role === 'college_admin_dkte') {
                navigate('/admin/dkte', { replace: true });
            } else if (role === 'college_admin_sharad') {
                navigate('/admin/sharad', { replace: true });
            }
        }
    }, [navigate]);
    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: '4rem', padding: '0 1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="hero-title" style={{ fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>
                    {t('home.heroTitle', { role: displayRole })}
                </h1>
                <p className="hero-subtitle" style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                    {t('home.heroSubtitle', { role: displayRole })}
                </p>
            </div>

            <div className="flex-mobile-col" style={{ display: 'flex', gap: '1rem', marginBottom: '4rem' }}>
                <Link to="/screening" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                    <Brain size={20} />
                    {t('home.takeScreening')}
                </Link>
                <Link to="/dashboard" className="btn btn-glass" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                    {t('nav.dashboard')}
                </Link>
            </div>

            <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="glass-panel gradient-border-card" style={{ padding: '2rem', textAlign: 'left' }}>
                    <div style={{ background: 'var(--highlight)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <Activity color="var(--primary)" size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{t('home.features.aiScreening')}</h3>
                    <p style={{ color: 'var(--text-muted)' }}>{t('home.features.aiScreeningDesc')}</p>
                </div>

                <div className="glass-panel gradient-border-card" style={{ padding: '2rem', textAlign: 'left' }}>
                    <div style={{ background: 'rgba(108, 140, 255, 0.15)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <Shield color="var(--primary)" size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{t('home.features.peerSupport')}</h3>
                    <p style={{ color: 'var(--text-muted)' }}>{t('home.features.peerSupportDesc')}</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
