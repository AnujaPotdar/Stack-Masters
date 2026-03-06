import { useState } from 'react';
import { User, LogOut, ChevronDown, Activity, ShieldAlert, BookOpen } from 'lucide-react';
import axios from 'axios';

const ProfilePopover = ({ userRole, handleLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    const togglePopover = async () => {
        const nextState = !isOpen;
        setIsOpen(nextState);

        if (nextState && !profile) {
            setLoading(true);
            try {
                const token = sessionStorage.getItem('token');
                const res = await axios.get('http://localhost:8000/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(res.data);
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setLoading(false);
            }
        }
    };

    const getRiskColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'critical': return 'var(--danger)';
            case 'moderate': return 'var(--warning)';
            default: return 'var(--success)';
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={togglePopover}
                className="btn btn-glass"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: isOpen ? 'rgba(0,0,0,0.05)' : 'transparent' }}
            >
                <User size={18} />
                Profile
                <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {isOpen && (
                <div className="glass-panel animate-slide-up" style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    width: '300px',
                    maxWidth: 'calc(100vw - 2rem)',
                    padding: '1.5rem',
                    zIndex: 50,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                            <Activity className="animate-spin" size={24} color="var(--primary)" />
                        </div>
                    ) : profile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{profile.name}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{profile.email}</p>
                                <span style={{
                                    display: 'inline-block',
                                    marginTop: '0.5rem',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    textTransform: 'capitalize'
                                }}>
                                    {profile.role}
                                </span>
                            </div>

                            {/* Show readiness metrics for students/soldiers/adults */}
                            {profile.role !== 'college_admin_dkte' && profile.role !== 'college_admin_sharad' && profile.role !== 'project_admin' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                                        <Activity size={18} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Readiness</div>
                                        <div style={{ fontWeight: 'bold' }}>{profile.readiness_score}%</div>
                                    </div>
                                    <div style={{
                                        background: `${getRiskColor(profile.risk_level)}22`,
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <ShieldAlert size={18} color={getRiskColor(profile.risk_level)} style={{ margin: '0 auto 0.5rem' }} />
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Risk Level</div>
                                        <div style={{ fontWeight: 'bold', color: getRiskColor(profile.risk_level) }}>{profile.risk_level}</div>
                                    </div>
                                </div>
                            )}

                            {profile.college && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <BookOpen size={16} />
                                    {profile.college}
                                </div>
                            )}

                            <button onClick={handleLogout} className="btn" style={{
                                marginTop: '0.5rem',
                                width: '100%',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--danger)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '0.5rem'
                            }}>
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--danger)', textAlign: 'center' }}>Failed to load profile.</p>
                    )}
                </div>
            )}

            {/* Click outside backdrop overlay */}
            {isOpen && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default ProfilePopover;
