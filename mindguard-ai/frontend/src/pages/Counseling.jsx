import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Loader } from 'lucide-react';
import axios from 'axios';

export default function Counseling() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [messages, setMessages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const recognitionRef = useRef(null);

    useEffect(() => {
        // Initialize Web Speech API
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = async (event) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                setIsListening(false);
                await handleSend(text);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        } else {
            console.warn("Speech Recognition API not supported in this browser.");
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (e) {
                console.error("Failed to start speech recognition:", e);
            }
        }
    };

    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            // Try to find a good female voice or just default
            const voices = window.speechSynthesis.getVoices();
            const goodVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Female')) || voices[0];
            if (goodVoice) utterance.voice = goodVoice;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSend = async (text) => {
        if (!text.trim()) return;

        // Add user message
        const newMessages = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);
        setIsProcessing(true);

        try {
            const res = await axios.post('http://localhost:8000/counseling/speak', { text });
            const aiReply = res.data.reply;

            setMessages([...newMessages, { role: 'ai', content: aiReply }]);
            speakText(aiReply);
        } catch (error) {
            console.error("Backend error:", error);
            setMessages([...newMessages, { role: 'ai', content: "I'm sorry, I'm having trouble connecting to my servers right now." }]);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="animate-fade-in container" style={{ padding: '2rem 0', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h1 className="hero-title" style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>AI Voice Counselor</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
                Talk to your personal AI health guide. Click the microphone and speak your thoughts aloud.
            </p>

            <div
                className={`glass-panel`}
                style={{
                    display: 'inline-flex',
                    padding: '3rem',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    background: isListening ? 'rgba(236, 72, 153, 0.2)' : 'var(--glass-bg)',
                    border: `2px solid ${isListening ? 'var(--secondary)' : 'var(--glass-border)'}`,
                    transition: 'all 0.3s ease',
                    boxShadow: isListening ? '0 0 40px rgba(236, 72, 153, 0.4)' : 'none'
                }}
                onClick={toggleListening}
            >
                {isListening ? <Mic size={80} color="var(--secondary)" /> : <MicOff size={80} color="var(--text-muted)" />}
            </div>

            <div style={{ marginTop: '2rem', height: '100px' }}>
                {isListening && <p style={{ color: 'var(--secondary)', fontSize: '1.2rem' }} className="animate-fade-in">Listening. Please speak...</p>}
                {isProcessing && <p style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Loader /> Processing your voice...</p>}
                {!isListening && !isProcessing && transcript && <p style={{ color: 'var(--text-muted)' }}>You said: "{transcript}"</p>}
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'left', background: 'var(--glass-bg)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Volume2 size={24} color="var(--primary)" /> Session Transcript
                </h3>

                {messages.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Your conversation will appear here...</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                background: m.role === 'user' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                                border: `1px solid ${m.role === 'user' ? 'rgba(79, 70, 229, 0.2)' : 'var(--glass-border)'}`,
                                padding: '1rem',
                                borderRadius: '12px',
                                maxWidth: '80%'
                            }}>
                                <span style={{ fontSize: '0.8rem', color: m.role === 'user' ? 'var(--primary)' : 'var(--secondary)', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>
                                    {m.role === 'user' ? 'You' : 'MindGuard AI'}
                                </span>
                                {m.content}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
