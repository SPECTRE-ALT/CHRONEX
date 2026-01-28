import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useGemini } from '../../hooks/useGemini';
import { Scan, RefreshCw, AlertTriangle, CheckCircle, Smartphone, Monitor } from 'lucide-react';

const VISION_MODEL = "gemini-1.5-flash";

export function PostureDetail() {
    const webcamRef = useRef(null);
    const { sendMessage, loading } = useGemini();
    const [analysis, setAnalysis] = useState(null);
    const [scanning, setScanning] = useState(false);

    const performDeepScan = useCallback(async () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setScanning(true);

        const prompt = `
            Analyze this ergonomic setup. Provide a DETAILED JSON breakdown.
            Return JSON ONLY:
            {
                "headTilt": "Neutral" | "Forward" | "Tilted Left" | "Tilted Right",
                "shoulderLevel": "Level" | "Uneven",
                "distance": "Optimal" | "Too Close" | "Too Far",
                "lighting": "Good" | "Dim" | "Harsh",
                "overallScore": (0-100),
                "corrections": ["Bulletin 1", "Bulletin 2"]
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

        try {
            const response = await sendMessage(VISION_MODEL, messages);
            if (response) {
                let cleanJson = response.replace(/```json|```/g, '').trim();
                const start = cleanJson.indexOf('{');
                const end = cleanJson.lastIndexOf('}');
                if (start !== -1 && end !== -1) {
                    setAnalysis(JSON.parse(cleanJson.substring(start, end + 1)));
                }
            }
        } catch (e) {
            console.error("Deep Scan Error", e);
        } finally {
            setScanning(false);
        }
    }, [sendMessage]);

    // Initial scan
    useEffect(() => {
        const t = setTimeout(performDeepScan, 1000);
        return () => clearTimeout(t);
    }, [performDeepScan]);

    const MetricRow = ({ label, value, status }) => (
        <div className="flex justify-between items-center py-3 border-b border-white/5">
            <span className="text-sm text-gray-400">{label}</span>
            <span className={`text-sm font-bold font-mono ${status === 'bad' ? 'text-chronex-alert' :
                    status === 'warn' ? 'text-yellow-400' : 'text-chronex-success'
                }`}>
                {value}
            </span>
        </div>
    );

    return (
        <div className="glass-panel h-full flex flex-col p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Scan className="text-chronex-accent" />
                    Biometric Lab
                </h3>
                <button
                    onClick={performDeepScan}
                    disabled={scanning}
                    className="glass-btn hover:border-chronex-accent/50 hover:text-chronex-accent"
                >
                    <RefreshCw size={14} className={scanning ? "animate-spin" : ""} />
                    {scanning ? "Scanning..." : "Re-Scan"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Visualizer Feed */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black group">
                    <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                        videoConstraints={{ facingMode: "user" }}
                    />

                    {/* Skeleton Overlay Effect */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 w-64 h-80 -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-white/20 rounded-full opacity-30" />
                        <div className="absolute top-[30%] left-1/2 w-px h-[40%] bg-chronex-accent/50 -translate-x-1/2" />
                        <div className="absolute top-[35%] left-1/2 w-32 h-px bg-chronex-accent/30 -translate-x-1/2" />
                        {scanning && (
                            <div className="absolute inset-x-0 h-1 bg-chronex-accent/50 shadow-[0_0_20px_#ccff00] animate-[scan_2s_linear_infinite]" />
                        )}
                    </div>
                </div>

                {/* Analysis Data */}
                <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Posture Integrity</div>
                        <div className="text-5xl font-bold text-white tracking-tighter">
                            {analysis?.overallScore || "--"}
                            <span className="text-lg text-chronex-accent ml-1">/100</span>
                        </div>
                    </div>

                    <div className="flex-1">
                        <MetricRow
                            label="Head Tilt"
                            value={analysis?.headTilt || "Analyzing..."}
                            status={analysis?.headTilt === 'Neutral' ? 'good' : 'warn'}
                        />
                        <MetricRow
                            label="Shoulder Alignment"
                            value={analysis?.shoulderLevel || "Analyzing..."}
                            status={analysis?.shoulderLevel === 'Level' ? 'good' : 'warn'}
                        />
                        <MetricRow
                            label="Screen Distance"
                            value={analysis?.distance || "Analyzing..."}
                            status={analysis?.distance === 'Optimal' ? 'good' : 'bad'}
                        />
                        <MetricRow
                            label="Ambient Light"
                            value={analysis?.lighting || "Analyzing..."}
                            status={analysis?.lighting === 'Good' ? 'good' : 'warn'}
                        />
                    </div>

                    {analysis?.corrections && analysis.corrections.length > 0 && (
                        <div className="p-4 rounded-xl bg-chronex-accent/10 border border-chronex-accent/20">
                            <h4 className="text-sm font-bold text-chronex-accent mb-2 flex items-center gap-2">
                                <AlertTriangle size={14} /> Recommended Corrections
                            </h4>
                            <ul className="space-y-2">
                                {analysis.corrections.map((c, i) => (
                                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                        <span className="mt-1.5 w-1 h-1 bg-chronex-accent rounded-full" />
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
