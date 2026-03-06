import { useState, useEffect } from 'react';
import { Shield, Brain, Activity, Wind, EyeOff, Video, Camera, Mic, Volume2 } from 'lucide-react';
import axios from 'axios';
import { useRef } from 'react';

const DefenceDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isAnonymous, setIsAnonymous] = useState(false);

    // Screening Form State
    const [screeningData, setScreeningData] = useState({
        mood: 3, sleep_hours: 6, fatigue: 3, anxiety: 3,
        nightmares: 1, flashbacks: 1, emotional_numbness: 1, hyper_alertness: 1
    });

    const [screeningResult, setScreeningResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // Tactical Breathing State
    const [breathingPhase, setBreathingPhase] = useState('Idle');
    const [timeLeft, setTimeLeft] = useState(0);
    const [isBreathingActive, setIsBreathingActive] = useState(false);

    // Live AI Camera State
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [messages, setMessages] = useState([]);
    const [liveAnswer, setLiveAnswer] = useState('');
    const [liveAnalysis, setLiveAnalysis] = useState(null);
    const [liveLoading, setLiveLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Reference to prevent Chrome from garbage collecting the utterance before it finishes
    const utteranceRef = useRef(null);

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
            window.speechSynthesis.cancel(); // Stop any ongoing speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95; // Slightly slower for a clear, calm voice
            utterance.pitch = 1.0;

            // Try to find a good English voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US'));
            if (preferredVoice) utterance.voice = preferredVoice;

            utteranceRef.current = utterance; // Keep ref alive
            window.speechSynthesis.speak(utterance);
        }
    };

    // --- Tab Change Effect to Handle Camera ---
    useEffect(() => {
        if (activeTab !== 'live-ai' && cameraActive) {
            stopCamera();
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        }
    }, [activeTab]);

    const startCamera = async () => {
        // Unlock Audio engine synchronously on user click
        if ('speechSynthesis' in window) {
            const temp = new SpeechSynthesisUtterance('');
            window.speechSynthesis.speak(temp);
        }

        try {
            setLiveLoading(true);
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API not available. Ensure you are accessing via 'http://localhost' (not an IP address) or HTTPS.");
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
            const res = await axios.post('http://localhost:8000/defence/interaction-session', { messages: [] });
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

    // Auto-speak the LATEST AI message when it arrives
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'ai' && !liveAnalysis) {
            speakText(lastMessage.content);
        }
    }, [messages, liveAnalysis]);

    // Auto-speak analysis when it changes 
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
            // Return base64 without the data:image/jpeg;base64, prefix for backend
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
            setLiveAnswer(''); // clear input

            const res = await axios.post('http://localhost:8000/defence/interaction-session', { messages: newHistory });
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
            const base64Image = captureImage();
            const token = sessionStorage.getItem('token');
            let historyToAnalyze = [...messages];

            if (liveAnswer.trim()) {
                historyToAnalyze.push({ role: "user", content: liveAnswer, image_data: base64Image });
            } else if (historyToAnalyze.length > 0 && historyToAnalyze[historyToAnalyze.length - 1].role === "user") {
                // Attach image to the last existing user message
                historyToAnalyze[historyToAnalyze.length - 1].image_data = base64Image;
            }

            if (liveAnswer.trim()) {
                setMessages(historyToAnalyze);
                setLiveAnswer('');
            }

            const res = await axios.post('http://localhost:8000/defence/interaction-analyze',
                { messages: historyToAnalyze },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLiveAnalysis(res.data);
            // We keep the camera active so the user sees the result with their face still on screen
        } catch (err) {
            console.error(err);
            alert("Failed to analyze session.");
        } finally {
            setLiveLoading(false);
        }
    };

    useEffect(() => {
        let interval = null;
        if (isBreathingActive) {
            // Box Breathing: 4s In, 4s Hold, 4s Out, 4s Hold
            if (timeLeft === 0) {
                if (breathingPhase === 'Idle' || breathingPhase === 'Hold (Empty)') {
                    setBreathingPhase('Breathe In');
                    setTimeLeft(4);
                } else if (breathingPhase === 'Breathe In') {
                    setBreathingPhase('Hold (Full)');
                    setTimeLeft(4);
                } else if (breathingPhase === 'Hold (Full)') {
                    setBreathingPhase('Breathe Out');
                    setTimeLeft(4);
                } else if (breathingPhase === 'Breathe Out') {
                    setBreathingPhase('Hold (Empty)');
                    setTimeLeft(4);
                }
            } else {
                interval = setInterval(() => {
                    setTimeLeft(prev => prev - 1);
                }, 1000);
            }
        } else {
            setBreathingPhase('Idle');
            setTimeLeft(0);
        }
        return () => clearInterval(interval);
    }, [isBreathingActive, timeLeft, breathingPhase]);

    const handleInputChange = (field, value) => {
        setScreeningData(prev => ({ ...prev, [field]: value }));
    };

    const submitScreening = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const endpoint = isAnonymous ? '/defence/anonymous-screening' : '/defence/screening';
            const res = await axios.post(`http://localhost:8000${endpoint}`, screeningData);
            setScreeningResult(res.data);
            setActiveTab('results');
        } catch (err) {
            console.error(err);
            alert("Error submitting screening. Are you offline? Check the Offline Tools tab.");
        } finally {
            setLoading(false);
        }
    };

    const renderScale = (field, label, min = 1, max = 5) => (
        <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>{label}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{screeningData[field]}</span>
            </label>
            <input
                type="range"
                min={min} max={max} step={field === 'sleep_hours' ? 0.5 : 1}
                value={screeningData[field]}
                onChange={(e) => handleInputChange(field, parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Low / Poor</span>
                <span>High / Good</span>
            </div>
        </div>
    );

    return (
        <div className="animate-slide-up" style={{ marginTop: '2rem' }}>
            <header className="flex-mobile-col text-mobile-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Shield size={32} />
                        Defence Dashboard
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Specialized tools for operational readiness and combat stress.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.5)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                    <EyeOff size={18} color={isAnonymous ? 'var(--success)' : 'var(--text-muted)'} />
                    <span style={{ fontSize: '0.9rem' }}>Anonymous Mode</span>
                    <label className="switch" style={{ marginLeft: '0.5rem' }}>
                        <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                        <span className="slider round"></span>
                    </label>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {['overview', 'live-interaction', 'stress-test', 'ptsd-check', 'breathing', 'offline-tools', 'results'].map(tab => (
                    (tab !== 'results' || screeningResult) && (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-glass'}`}
                            style={{ whiteSpace: 'nowrap', textTransform: 'capitalize' }}
                        >
                            {tab.replace('-', ' ')}
                        </button>
                    )
                ))}
            </div>

            <div className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
                {activeTab === 'overview' && (
                    <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', paddingTop: '2rem' }}>
                        <Shield size={64} color="var(--danger)" style={{ margin: '0 auto 1.5rem', opacity: 0.8 }} />
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Operational Readiness</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                            This dashboard provides field-ready psychological tools. Use the Stress Test for daily readiness checks, PTSD Check for trauma screening, and Tactical Breathing for immediate combat calm resets.
                        </p>
                        <button onClick={() => setActiveTab('stress-test')} className="btn btn-primary">
                            Start Daily Check-in
                        </button>
                    </div>
                )}

                {activeTab === 'stress-test' && (
                    <form onSubmit={submitScreening} style={{ maxWidth: '500px', margin: '0 auto' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <Activity color="var(--primary)" /> Operational Stress Test
                        </h2>
                        {renderScale('mood', 'Current Mood (1=Poor, 5=Excellent)')}
                        {renderScale('sleep_hours', 'Hours of Sleep Last Night', 0, 12)}
                        {renderScale('fatigue', 'Physical/Mental Fatigue (1=None, 5=Exhausted)')}
                        {renderScale('anxiety', 'Current Anxiety Level (1=Calm, 5=Panic)')}
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                            {loading ? 'Analyzing...' : 'Submit & Analyze'}
                        </button>
                    </form>
                )}

                {activeTab === 'ptsd-check' && (
                    <form onSubmit={submitScreening} style={{ maxWidth: '500px', margin: '0 auto' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <Brain color="var(--secondary)" /> PTSD & Trauma Early Detection
                        </h2>
                        {renderScale('nightmares', 'Frequency of Nightmares (1=None, 5=Frequent)')}
                        {renderScale('flashbacks', 'Intrusive Memories/Flashbacks (1=None, 5=Frequent)')}
                        {renderScale('emotional_numbness', 'Feeling Emotionally Numb (1=None, 5=Severe)')}
                        {renderScale('hyper_alertness', 'Hyper-alertness / easily startled (1=None, 5=Severe)')}
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                            {loading ? 'Analyzing...' : 'Submit & Analyze'}
                        </button>
                    </form>
                )}

                {activeTab === 'results' && screeningResult && (
                    <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
                        <h2 style={{ marginBottom: '2rem' }}>Screening Results</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '12px', border: `1px solid ${screeningResult.stress_score === 'Ready' ? 'var(--success)' : screeningResult.stress_score === 'Monitor' ? 'var(--warning)' : 'var(--danger)'}` }}>
                                <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>Readiness Score</h3>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: screeningResult.stress_score === 'Ready' ? 'var(--success)' : screeningResult.stress_score === 'Monitor' ? 'var(--warning)' : 'var(--danger)' }}>
                                    {screeningResult.stress_score}
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', borderRadius: '12px', border: `1px solid ${screeningResult.ptsd_risk === 'Low' ? 'var(--success)' : screeningResult.ptsd_risk === 'Medium' ? 'var(--warning)' : 'var(--danger)'}` }}>
                                <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>PTSD & Trauma Risk</h3>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: screeningResult.ptsd_risk === 'Low' ? 'var(--success)' : screeningResult.ptsd_risk === 'Medium' ? 'var(--warning)' : 'var(--danger)' }}>
                                    {screeningResult.ptsd_risk}
                                </div>
                            </div>
                        </div>

                        {(screeningResult.stress_score === 'Needs Support' || screeningResult.ptsd_risk !== 'Low') && (
                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                                <p style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>You are showing signs of high combat stress. Please use the Tactical Breathing tool now, or view our offline counseling materials.</p>
                                <button onClick={() => setActiveTab('breathing')} className="btn btn-primary">Go to Tactical Breathing</button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'live-interaction' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--secondary)' }}>
                            <Camera /> Live Interaction
                        </h2>

                        {!cameraActive && (
                            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                                <Camera size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--text-muted)' }} />
                                <h3 style={{ marginBottom: '1rem' }}>Start Conversational Session</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Experience a direct, Alexa-like conversational interface for psychological assistance. Enable your microphone and camera to talk freely.</p>
                                <button onClick={startCamera} className="btn btn-primary" disabled={liveLoading}>
                                    {liveLoading ? 'Initializing...' : 'Enable Camera & Start Voice Interaction'}
                                </button>
                            </div>
                        )}

                        {cameraActive && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* 1. PERMANENT CAMERA DISPLAY */}
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

                                {/* 2. VOICE INTERACTION MODULE (Hidden if analyzing) */}
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


                                {/* 3. DIAGNOSIS RESULT */}
                                {liveAnalysis && (
                                    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                                        <Brain size={64} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
                                        <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Final Mental Condition Analysis</h3>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '2rem' }}>
                                            {liveAnalysis.mental_state}
                                        </div>
                                        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.8)', padding: '2rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                            <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>Clinical Diagnosis:</h4>
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

                {activeTab === 'breathing' && (
                    <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
                        <Wind size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                        <h2 style={{ marginBottom: '0.5rem' }}>Tactical Box Breathing</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>Used by Special Forces for a 60-second combat calm reset.</p>

                        <div style={{
                            position: 'relative', width: '250px', height: '250px', margin: '0 auto 3rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)',
                            transition: 'all 4s linear',
                            transform: breathingPhase === 'Breathe In' || breathingPhase === 'Hold (Full)' ? 'scale(1.2)' : 'scale(1)',
                            background: breathingPhase === 'Idle' ? 'transparent' : 'rgba(236, 72, 153, 0.1)'
                        }}>
                            <div style={{ position: 'absolute', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{breathingPhase}</div>
                                {isBreathingActive && <div style={{ fontSize: '2rem', marginTop: '0.5rem' }}>{timeLeft}s</div>}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsBreathingActive(!isBreathingActive)}
                            className={`btn ${isBreathingActive ? 'btn-glass' : 'btn-primary'}`}
                            style={{ minWidth: '200px' }}
                        >
                            {isBreathingActive ? 'Stop Training' : 'Start Training'}
                        </button>
                    </div>
                )}

                {activeTab === 'offline-tools' && (
                    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <Video color="var(--success)" /> Preloaded Field Materials
                        </h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            These resources are cached on your device and can be accessed without an internet connection in bunkers, ships, or remote borders.
                        </p>

                        <div className="grid-mobile-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.5)', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div style={{ height: '140px', background: 'rgba(108,140,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Video size={32} color="var(--primary)" />
                                    </div>
                                    <div style={{ padding: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{['Managing Combat Trauma', 'Sleep Hygiene in Field', 'Depression First-Aid'][i - 1]}</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Offline ready • 5 mins</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #555; transition: .4s; }
                .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
                input:checked + .slider { background-color: var(--success); }
                input:checked + .slider:before { transform: translateX(20px); }
                .slider.round { border-radius: 34px; }
                .slider.round:before { border-radius: 50%; }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.3; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div >
    );
};

export default DefenceDashboard;
