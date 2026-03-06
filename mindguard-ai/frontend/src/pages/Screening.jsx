import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity } from 'lucide-react';

const Screening = () => {
    // Increased from 5 to 6 questions
    const [answers, setAnswers] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const navigate = useNavigate();

    const questions = [
        "1. How have you been feeling emotionally over the past week? (E.g. anxious, depressed, generally okay)",
        "2. Are you experiencing any difficulties concentrating, sleeping, or maintaining energy?",
        "3. Describe any significant sources of stress or major life changes you are currently facing.",
        "4. Have you felt overwhelmed to the point of panic, or felt hopeless about the future recenty?",
        "5. What coping mechanisms or support systems do you typically rely on when you are stressed?",
        "6. Do you have any other queries, extra thoughts, or symptoms you'd like to share?"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:8000/screening/submit', { answers });

            // The new API returns { user: User, feedback: str }
            setResults({
                score: res.data.user.readiness_score,
                risk: res.data.user.risk_level,
                feedback: res.data.feedback
            });

        } catch (error) {
            console.error("Screening Failed", error);
            alert("Failed to submit screening. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (results) {
        // Render Results View
        const getRiskColor = (risk) => {
            if (risk === "Critical") return "var(--danger)";
            if (risk === "Moderate") return "var(--warning)";
            return "var(--success)";
        };

        return (
            <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '3rem auto' }}>
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Activity size={48} color={getRiskColor(results.risk)} style={{ marginBottom: '1.5rem' }} />
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Your Assessment Results</h1>

                    <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '2rem 0' }}>
                        <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '12px', minWidth: '150px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Readiness Score</p>
                            <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)' }}>{results.score}/100</h2>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '12px', minWidth: '150px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Risk Level</p>
                            <h2 style={{ fontSize: '2rem', color: getRiskColor(results.risk) }}>{results.risk}</h2>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.8)', padding: '2rem', borderRadius: '12px', borderLeft: `4px solid ${getRiskColor(results.risk)}`, textAlign: 'left', marginBottom: '2.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Clinical Assessor Feedback</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1.1rem' }}>
                            {results.feedback}
                        </p>
                    </div>

                    <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
                        Continue to Dashboard
                    </button>

                    {results.risk === "Critical" && (
                        <p style={{ marginTop: '1.5rem', color: 'var(--danger)', fontSize: '0.9rem' }}>
                            If you are in immediate distress, please consider contacting emergency services or a crisis helpline immediately.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '3rem auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Psychological Screening</h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Please answer the following questions as thoroughly and honestly as possible. Your answers will be securely analyzed by our AI clinical assistant to determine your personal readiness score.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2.5rem' }}>
                {questions.map((q, idx) => (
                    <div key={idx} style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 500 }}>
                            {q}
                        </label>
                        <textarea
                            rows="3"
                            placeholder="Type your answer here..."
                            value={answers[idx]}
                            onChange={(e) => {
                                const newAns = [...answers];
                                newAns[idx] = e.target.value;
                                setAnswers(newAns);
                            }}
                            required
                        ></textarea>
                    </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                        {loading ? "AI is Analyzing Your Answers..." : "Submit Confidential Assessment"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Screening;
