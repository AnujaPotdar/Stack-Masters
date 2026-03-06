import { useState, useEffect, useRef } from 'react';
import { Activity, ShieldAlert, Loader, Camera, Mic, Brain, Volume2 } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
    const { t } = useTranslation();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Live Interaction State
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const utteranceRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [messages, setMessages] = useState([]);
    const [liveAnswer, setLiveAnswer] = useState('');
    const [liveAnalysis, setLiveAnalysis] = useState(null);
    const [liveLoading, setLiveLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // --- Speech Recognition Setup ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;
    if (recognition) {
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }
            if (finalTranscript) {
                setLiveAnswer(prev => prev + finalTranscript);
            }
        };
        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };
        recognition.onend = () => {
            setIsListening(false);
        };
    }

    const toggleListening = () => {
        if (!recognition) {
            alert("Speech Recognition API not supported in this browser.");
            return;
        }
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
            setIsListening(true);
        }
    };

    // --- Text to Speech Setup ---
    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US'));
            if (preferredVoice) utterance.voice = preferredVoice;

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const timestamp = new Date().getTime();
                const res = await axios.get(`http://localhost:8000/auth/me?t=${timestamp}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setUserData(res.data);
            } catch (error) {
                console.error("Failed to fetch user data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        if (activeTab !== 'live-interaction' && cameraActive) {
            stopCamera();
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        }
    }, [activeTab]);

    const startCamera = async () => {
        if ('speechSynthesis' in window) {
            const temp = new SpeechSynthesisUtterance('');
            window.speechSynthesis.speak(temp);
        }

        try {
            setLiveLoading(true);
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API not available.");
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
            startSession();
        } catch (err) {
            console.error(err);
            alert(`Unable to access camera/microphone: ${err.message || 'Permissions denied.'}`);
            setLiveLoading(false);
        }
    };

    const startSession = async () => {
        setLiveLoading(true);
        setMessages([]);
        setLiveAnalysis(null);
        setLiveAnswer('');
        try {
            const res = await axios.post('http://localhost:8000/counseling/interaction-session', { messages: [] });
            const initialQuestion = res.data.question;
            setMessages([{ role: "ai", content: initialQuestion }]);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.detail) {
                alert(`AI Error: ${err.response.data.detail}`);
            } else {
                alert("Could not connect to AI. Please try again later.");
            }
        } finally {
            setLiveLoading(false);
        }
    };

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'ai' && !liveAnalysis) {
            speakText(lastMessage.content);
        }
    }, [messages, liveAnalysis]);

    useEffect(() => {
        if (liveAnalysis) {
            speakText(`Analysis complete. Your state is: ${liveAnalysis.mental_state}. ${liveAnalysis.analysis}`);
        }
    }, [liveAnalysis]);

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setCameraActive(false);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            return dataUrl.split(',')[1];
        }
        return null;
    };

    const submitUserAnswer = async () => {
        if (!liveAnswer.trim()) return;
        if (isListening) toggleListening();
        setLiveLoading(true);
        try {
            const base64Image = captureImage();
            const newHistory = [...messages, { role: "user", content: liveAnswer, image_data: base64Image }];
            setMessages(newHistory);
            setLiveAnswer('');

            const res = await axios.post('http://localhost:8000/counseling/interaction-session', { messages: newHistory });
            const nextQuestion = res.data.question;

            setMessages([...newHistory, { role: "ai", content: nextQuestion }]);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.detail) {
                alert(`AI Error: ${err.response.data.detail}`);
            } else {
                alert("Failed to connect to AI Server.");
            }
        } finally {
            setLiveLoading(false);
        }
    };

    const submitFinalAnalysis = async () => {
        if (messages.length < 2) {
            alert("Please interact at least once before ending the session.");
            return;
        }
        if (isListening) toggleListening();
        setLiveLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const base64Image = captureImage();
            let historyToAnalyze = [...messages];

            if (liveAnswer.trim()) {
                historyToAnalyze.push({ role: "user", content: liveAnswer, image_data: base64Image });
            } else if (historyToAnalyze.length > 0 && historyToAnalyze[historyToAnalyze.length - 1].role === "user") {
                historyToAnalyze[historyToAnalyze.length - 1].image_data = base64Image;
            }

            if (liveAnswer.trim()) {
                setMessages(historyToAnalyze);
                setLiveAnswer('');
            }

            const res = await axios.post('http://localhost:8000/counseling/interaction-analyze',
                { messages: historyToAnalyze },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLiveAnalysis(res.data);
        } catch (err) {
            console.error(err);
            alert("Failed to analyze session.");
        } finally {
            setLiveLoading(false);
        }
    };

    const getRiskColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'critical': return 'var(--danger)';
            case 'moderate': return 'var(--warning)';
            default: return 'var(--success)';
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Loader className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    if (!userData) {
        return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Error loading dashboard.</div>;
    }

    return (
        <div className="animate-slide-up" style={{ marginTop: '2rem' }}>
            <header className="flex-mobile-col text-mobile-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{t('dashboard.title')}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{t('dashboard.welcome')}, {userData.name}. Here's your mental health summary.</p>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {['overview', 'live-interaction'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-glass'}`}
                        style={{ whiteSpace: 'nowrap', textTransform: 'capitalize' }}
                    >
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>

            <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
                {activeTab === 'overview' && (
                    <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <div className="glass-panel flex-mobile-col" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="10" />
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" strokeWidth="10" strokeDasharray="283" strokeDashoffset={`${283 - (283 * userData.readiness_score) / 100}`} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{userData.readiness_score}%</span>
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t('dashboard.readinessScore')}</h3>
                                <p style={{ fontSize: '0.9rem' }}>Based on your recent screening.</p>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ background: `${getRiskColor(userData.risk_level)}33`, padding: '1rem', borderRadius: '12px' }}>
                                    <ShieldAlert color={getRiskColor(userData.risk_level)} size={32} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>{t('dashboard.riskLevel')}</h3>
                                    <p style={{ fontSize: '2rem', fontWeight: 700, color: getRiskColor(userData.risk_level) }}>{userData.risk_level}</p>
                                </div>
                            </div>
                            {userData.risk_level === 'Critical' && (
                                <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--danger)', fontSize: '0.9rem' }}>
                                    Immediate intervention recommended. Please see the chatbot or contact support.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'live-interaction' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--secondary)' }}>
                            <Camera /> Live Counseling Interaction
                        </h2>

                        {!cameraActive && (
                            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                                <Camera size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--text-muted)' }} />
                                <h3 style={{ marginBottom: '1rem' }}>Start Conversational Session</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Have a direct, conversational check-in with the AI Counselor. Enable your microphone and camera.</p>
                                <button onClick={startCamera} className="btn btn-primary" disabled={liveLoading}>
                                    {liveLoading ? 'Initializing...' : 'Enable Camera & Start Voice Interaction'}
                                </button>
                            </div>
                        )}

                        {cameraActive && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', background: '#1A202C', border: isListening ? '4px solid var(--secondary)' : 'none' }}>
                                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block' }} />
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(239, 68, 68, 0.8)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'white' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }}></div>
                                        LIVE IN SESSION
                                    </div>
                                    {isListening && (
                                        <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.9)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                            <Mic size={16} /> Listening...
                                        </div>
                                    )}
                                </div>

                                {!liveAnalysis && (
                                    <div style={{ background: 'rgba(255,255,255,0.5)', padding: '2rem', borderRadius: '12px', opacity: messages.length === 0 ? 0.5 : 1 }}>
                                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                            <h3 style={{ color: 'var(--secondary)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>MindGuard AI is speaking:</h3>
                                            <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontStyle: 'italic', minHeight: '3rem' }}>
                                                {messages.length === 0 ? "Connecting to secure network..." :
                                                    messages[messages.length - 1].role === 'ai' ? `"${messages[messages.length - 1].content}"` :
                                                        "Waiting for your response..."}
                                            </p>
                                        </div>

                                        {liveAnswer.trim() && (
                                            <div style={{ textAlign: 'center', marginBottom: '1.5rem', opacity: 0.8 }}>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>You: "{liveAnswer}"</p>
                                            </div>
                                        )}

                                        <div className="flex-mobile-col" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'center', marginTop: '1rem' }}>
                                            <button
                                                onClick={toggleListening}
                                                style={{ width: '80px', height: '80px', borderRadius: '50%', background: isListening ? '#ef4444' : 'var(--secondary)', color: '#fff', border: 'none', cursor: 'pointer', outline: 'none', transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (messages.length === 0 || liveLoading) ? 0.5 : 1, boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.5)' : 'none' }}
                                                disabled={liveLoading || messages.length === 0}
                                            >
                                                <Mic size={32} />
                                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{isListening ? 'STOP' : 'TALK'}</span>
                                            </button>
                                            <button onClick={submitUserAnswer} className="btn btn-primary" disabled={!liveAnswer.trim() || liveLoading || messages.length === 0} style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>
                                                {liveLoading ? 'Thinking...' : 'Respond'}
                                            </button>
                                        </div>

                                        <div style={{ textAlign: 'center', marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                                            <button onClick={submitFinalAnalysis} className="btn btn-glass" style={{ color: 'var(--warning)', borderColor: 'var(--warning)', padding: '0.8rem 2rem', fontSize: '1rem' }}>
                                                End Session & Generate Mental Condition Report
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {liveAnalysis && (
                                    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                                        <Brain size={64} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
                                        <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Final Mental Condition Analysis</h3>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '2rem' }}>
                                            {liveAnalysis.mental_state}
                                        </div>
                                        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.8)', padding: '2rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                            <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>Clinical Assessment:</h4>
                                            <p style={{ lineHeight: 1.8, fontSize: '1.1rem', marginBottom: '1rem' }}>{liveAnalysis.analysis}</p>

                                            {liveAnalysis.facial_expression_analysis && (
                                                <div style={{ marginBottom: '1rem', background: 'rgba(108,140,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
                                                    <h5 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Facial Expression Analysis</h5>
                                                    <p style={{ fontSize: '0.95rem' }}>{liveAnalysis.facial_expression_analysis}</p>
                                                </div>
                                            )}

                                            {liveAnalysis.voice_tone_analysis && (
                                                <div style={{ marginBottom: '1.5rem', background: 'rgba(108,140,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
                                                    <h5 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Voice Tone Analysis</h5>
                                                    <p style={{ fontSize: '0.95rem' }}>{liveAnalysis.voice_tone_analysis}</p>
                                                </div>
                                            )}

                                            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                                <button onClick={() => speakText(`Analysis complete. Your final mental condition is: ${liveAnalysis.mental_state}. ${liveAnalysis.analysis}`)} className="btn btn-glass" style={{ padding: '0.5rem 1rem', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
                                                    <Volume2 size={20} color="var(--primary)" /> Review Diagnosis Aloud
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-mobile-col" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '3rem' }}>
                                            <button onClick={() => { setLiveAnalysis(null); stopCamera(); }} className="btn btn-glass">
                                                Close Session
                                            </button>
                                            <button onClick={startSession} className="btn btn-primary">
                                                Start New Session
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
