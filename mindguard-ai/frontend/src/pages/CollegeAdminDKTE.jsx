import { useState, useEffect } from 'react';
import { Loader, Users, ShieldAlert, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const CollegeAdminDKTE = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStudents = async () => {
        setLoading(true);
        setError('');
        try {
            const token = sessionStorage.getItem('token');
            const timestamp = new Date().getTime(); // Cache buster
            const res = await axios.get(`http://localhost:8000/admin/students?college=DKTE%20textile%20and%20Engineering%20Institute&t=${timestamp}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setStudents(res.data);
        } catch (err) {
            console.error("Failed to fetch student data", err);
            setError('Failed to load student data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const getRiskColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'critical': return 'var(--danger)';
            case 'moderate': return 'var(--warning)';
            default: return 'var(--success)';
        }
    };

    const getChartData = () => {
        const counts = { Critical: 0, Moderate: 0, Low: 0 };
        students.forEach(s => {
            const level = s.risk_level?.toLowerCase() === 'critical' ? 'Critical'
                : s.risk_level?.toLowerCase() === 'moderate' ? 'Moderate'
                    : 'Low';
            counts[level]++;
        });
        return [
            { name: 'Critical Risk', value: counts.Critical, color: 'var(--danger)' },
            { name: 'Moderate Risk', value: counts.Moderate, color: 'var(--warning)' },
            { name: 'Low Risk', value: counts.Low, color: 'var(--success)' }
        ].filter(item => item.value > 0);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Loader className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    if (error) {
        return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--danger)' }}>{error}</div>;
    }

    return (
        <div className="animate-slide-up" style={{ marginTop: '2rem' }}>
            <header className="flex-mobile-col text-mobile-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>DKTE Admin Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Overview of student mental health and stress levels for DKTE Textile and Engineering Institute.</p>
                </div>
                <button onClick={fetchStudents} className="btn btn-glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={loading}>
                    <Activity size={18} className={loading ? "animate-spin" : ""} /> Refresh Data
                </button>
            </header>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div className="flex-mobile-col" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <Users size={24} color="var(--primary)" />
                    <h2 style={{ fontSize: '1.5rem' }}>Student List</h2>
                    <span style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.05)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.9rem' }}>
                        Total: {students.length}
                    </span>
                </div>

                {students.length > 0 && (
                    <div style={{ marginBottom: '3rem', height: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <PieChartIcon size={20} color="var(--secondary)" />
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Risk Distribution</h3>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={getChartData()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {getChartData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-main)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-main)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {students.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' }}>No students found for this college yet.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '1rem' }}>Name</th>
                                    <th style={{ padding: '1rem' }}>Email</th>
                                    <th style={{ padding: '1rem' }}>Readiness Score</th>
                                    <th style={{ padding: '1rem' }}>Risk Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{student.name}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{student.email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Activity size={16} color="var(--primary)" />
                                                {student.readiness_score}%
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                color: getRiskColor(student.risk_level),
                                                background: `${getRiskColor(student.risk_level)}22`,
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                <ShieldAlert size={14} />
                                                {student.risk_level}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollegeAdminDKTE;
