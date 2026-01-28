import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useGemini } from '../../hooks/useGemini';
import { Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

const VISION_MODEL = "gemini-1.5-flash";

export function VisionMonitor({ onUpdate }) {
    const webcamRef = useRef(null);
    const { sendMessage, loading } = useGemini();
    const [active, setActive] = useState(true);
    const [lastAnalysis, setLastAnalysis] = useState(null);
    const [status, setStatus] = useState("Initializing...");

    const analyze = useCallback(async () => {
        if (!webcamRef.current || !active) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        const prompt = `
      You are an ergonomic expert "Chronex". Analyze this webcam frame of a user working.
      Focus on: Head position, Neck angle, Distance from screen, Facial expression (focus/fatigue).
      Return JSON ONLY:
      {
        "postureStatus": "Good" | "Warning" | "Bad",
        "postureScore": (0-100 integer),
        "focusScore": (0-100 integer estimated from gaze/engagement),
        "issue": "None" | "Tech-neck" | "Slouching" | "Too Close" | "Tilted",
        "feedback": "Short actionable advice (max 10 words)",
        "alert": boolean (true if posture is harmful/critical),
        "alertMessage": "Short urgent message if alert is true"
      }
    `;

        const messages = [
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: imageSrc } }
                ]
            }
        ];

        const response = await sendMessage(VISION_MODEL, messages);

        setStatus("Processing...");

        if (response) {
            // Error Handling from Hook
            if (typeof response === 'string' && response.startsWith("[System Error]")) {
                setLastAnalysis({
                    postureStatus: "Error",
                    postureScore: 0,
                    feedback: response
                });
                setStatus("Connection Error");
                return;
            }

            try {
                let cleanJson = response.replace(/```json|```/g, '').trim();
                const firstBrace = cleanJson.indexOf('{');
                const lastBrace = cleanJson.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
                }
                const data = JSON.parse(cleanJson);
                const enrichedData = { ...data, timestamp: Date.now() };

                setLastAnalysis(enrichedData);
                setStatus("Active");

                // --- DAILY REPORT LOGGING ---
                try {
                    const history = JSON.parse(localStorage.getItem('chronex_daily_log') || '[]');
                    history.push({
                        timestamp: Date.now(),
                        score: data.postureScore,
                        issue: data.issue,
                        status: data.postureStatus
                    });
                    // Keep only last 100 entries to prevent storage bloat
                    if (history.length > 100) history.shift();
                    localStorage.setItem('chronex_daily_log', JSON.stringify(history));
                } catch (err) {
                    console.error("Storage Error", err);
                }

                if (onUpdate) onUpdate(enrichedData);
            } catch (e) {
                console.error("Parse error", e);
                setLastAnalysis({
                    postureStatus: "Error",
                    postureScore: 0,
                    feedback: "Neural Parse Error. Retrying..."
                });
                setStatus("Parse Error");
            }
        }
    }, [active, sendMessage, onUpdate, setStatus]);

    useEffect(() => {
        const interval = setInterval(analyze, 15000);
        return () => clearInterval(interval);
    }, [analyze]);

    return (
        <div className="glass-panel p-4 flex flex-col items-center gap-4 relative overflow-hidden group">
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/5">
                <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className={`w-full h-full object-cover transition-opacity duration-500 ${active ? 'opacity-50 group-hover:opacity-100' : 'opacity-0'}`}
                    videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                />
                {!active && <div className="absolute inset-0 flex items-center justify-center text-white/20">Camera Off</div>}

                {/* Sci-Fi HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-80">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(204,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(204,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

                    {active && (
                        <div className="absolute left-0 w-full h-1 bg-chronex-accent/30 shadow-[0_0_15px_rgba(204,255,0,0.5)] animate-[scan_3s_ease-in-out_infinite]"
                            style={{ top: '10%' }}
                        />
                    )}

                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-chronex-accent/50" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-chronex-accent/50" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-chronex-accent/50" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-chronex-accent/50" />

                    {active && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-chronex-accent/20 rounded-lg flex items-center justify-center">
                            <div className="w-1 h-1 bg-chronex-accent/50 rounded-full" />
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-mono text-chronex-accent/70 bg-black px-1">TARGET ACQ</div>
                        </div>
                    )}

                    {loading && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                            <div className="w-16 h-16 border-2 border-chronex-accent border-t-transparent rounded-full animate-spin" />
                            <div className="mt-2 text-center text-xs font-mono text-chronex-accent animate-pulse">ANALYZING</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActive(!active)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-chronex-accent"
                    >
                        {active ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                    <span className="text-xs font-mono text-chronex-text uppercase tracking-widest">
                        {status}
                    </span>
                </div>

                {lastAnalysis && (
                    <div className={`flex items-center gap-2 text-sm font-bold ${lastAnalysis.postureStatus === 'Good' ? 'text-green-400' : 'text-orange-400'
                        }`}>
                        {lastAnalysis.postureStatus === 'Good' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        <span>{lastAnalysis.postureScore}%</span>
                    </div>
                )}
            </div>

            {lastAnalysis && (
                <div className="w-full text-center">
                    <p className="text-xs text-white/60 mb-1">Feedback</p>
                    <p className="text-sm text-chronex-accent animate-pulse-slow">{lastAnalysis.feedback}</p>
                </div>
            )}
        </div>
    );
}
