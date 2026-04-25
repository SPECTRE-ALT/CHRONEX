import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { Scan, AlertTriangle, CheckCircle, User, Activity } from 'lucide-react';

export function BioMeshMonitor({ onUpdate }) {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [status, setStatus] = useState("Initializing Neural Mesh...");
    const [metrics, setMetrics] = useState({
        tilt: 0,
        distance: 0,
        alignment: 'Checking...',
        score: 100
    });

    // Core Logic for Posture Calculation
    const calculatePosture = useCallback((landmarks) => {
        // Landmarks: 
        // 1: Nose Tip
        // 33: Left Eye Inner
        // 263: Right Eye Inner
        // 152: Chin
        // 10: Top of Head
        // 234: Left Ear (approx)
        // 454: Right Ear (approx)

        const leftEar = landmarks[234];
        const rightEar = landmarks[454];
        const nose = landmarks[1];
        const chin = landmarks[152];
        const forehead = landmarks[10];

        // 1. Head Tilt (Roll) - Angle between ears
        const dy = rightEar.y - leftEar.y;
        const dx = rightEar.x - leftEar.x;
        const tiltRad = Math.atan2(dy, dx);
        const tiltDeg = tiltRad * (180 / Math.PI); // Normally 0 if level

        // 2. Neck Flexion (Pitch) - Ratio of Forehead-Nose vs Nose-Chin
        // If looking down, forehead-nose distance increases visually or nose-chin decreases? 
        // Actually, simple verticality: Nose Y position relative to simple center?
        // Better: Vertical distance between Ear-Y and Nose-Y.
        // If looking down, Nose drops lower than Ears significantly.
        const avgEarY = (leftEar.y + rightEar.y) / 2;
        const pitchDelta = nose.y - avgEarY; // Positive = Looking Down (Nose below ears)

        // 3. Distance (Z-estimate) - Width of face
        const faceWidth = Math.sqrt(Math.pow(rightEar.x - leftEar.x, 2) + Math.pow(rightEar.y - leftEar.y, 2));

        // --- Analysis ---
        let score = 100;
        let issues = [];
        let state = "Optimal";

        // Check Tilt
        if (Math.abs(tiltDeg) > 10) {
            score -= 20;
            issues.push("Head Tilted");
        }

        // Check Tech Neck (Pitch)
        // Typical value check needed. Heuristic:
        if (pitchDelta > 0.15) { // Threshold for "looking down"
            score -= 30;
            issues.push("Tech Neck Detected");
        }

        // Check Distance
        let distStatus = "Optimal";
        if (faceWidth > 0.45) {
            score -= 10;
            distStatus = "Too Close";
            issues.push("Too Close");
        } else if (faceWidth < 0.15) {
            score -= 10;
            distStatus = "Too Far";
            issues.push("Too Far");
        }

        const finalStatus = score > 80 ? "Good" : score > 50 ? "Warning" : "Bad";

        return {
            tilt: Math.round(tiltDeg),
            distance: distStatus,
            score: Math.max(0, score),
            issues,
            postureStatus: finalStatus,
            alert: score < 50,
            alertMessage: issues[0] || "Adjust Posture"
        };

    }, []);

    useEffect(() => {
        const faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results) => {
            if (!webcamRef.current || !canvasRef.current) return;

            // Draw Logic
            const videoWidth = webcamRef.current.video.videoWidth;
            const videoHeight = webcamRef.current.video.videoHeight;
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
            const canvasCtx = canvasRef.current.getContext('2d');

            canvasCtx.save();
            canvasCtx.clearRect(0, 0, videoWidth, videoHeight);

            // Draw Mesh Overlay (Sci-fi Style)
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];

                // Calculate Metrics
                const analysis = calculatePosture(landmarks);
                setMetrics(prev => ({ ...prev, ...analysis }));

                // Update Parent
                if (onUpdate) {
                    onUpdate({
                        postureScore: analysis.score,
                        focusScore: 95, // Assumed if face detected
                        alert: analysis.alert,
                        alertMessage: analysis.alertMessage
                    });
                }
                setStatus("Tracking Active");

                // Draw Dots
                for (const landmark of landmarks) {
                    const x = landmark.x * videoWidth;
                    const y = landmark.y * videoHeight;

                    canvasCtx.beginPath();
                    canvasCtx.arc(x, y, 1, 0, 2 * Math.PI);
                    canvasCtx.fillStyle = analysis.score > 80 ? '#ccff00' : '#ff4444';
                    canvasCtx.fill();
                }

                // Draw Connection Lines (Simplified Face Outline)
                // Just a box for effect
                // canvasCtx.strokeStyle = 'rgba(204, 255, 0, 0.3)';
                // canvasCtx.lineWidth = 1;
                // canvasCtx.strokeRect(landmarks[234].x*videoWidth, landmarks[10].y*videoHeight, (landmarks[454].x-landmarks[234].x)*videoWidth, (landmarks[152].y-landmarks[10].y)*videoHeight);
            } else {
                setStatus("No Face Detected");
                if (onUpdate) onUpdate({ focusScore: 0 }); // No user present
            }
            canvasCtx.restore();
        });

        if (typeof webcamRef.current !== "undefined" && webcamRef.current !== null) {
            const camera = new Camera(webcamRef.current.video, {
                onFrame: async () => {
                    if (webcamRef.current && webcamRef.current.video) {
                        await faceMesh.send({ image: webcamRef.current.video });
                    }
                },
                width: 640,
                height: 480
            });
            camera.start();
        }

        return () => {
            faceMesh.close();
        };
    }, [calculatePosture, onUpdate]);

    return (
        <div className="glass-panel p-4 flex flex-col items-center gap-4 relative overflow-hidden group min-h-[300px]">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <Scan size={16} className="text-chronex-accent animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-widest text-white/70">Bio-Mesh Link</span>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${status.includes('Active') ? 'bg-chronex-accent/20 text-chronex-accent' : 'bg-red-500/20 text-red-400'}`}>
                    {status}
                </div>
            </div>

            {/* Visualizer Area */}
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/5 shadow-inner">
                <Webcam
                    ref={webcamRef}
                    className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale contrast-125"
                    videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-2 left-2 text-[8px] font-mono text-chronex-accent/50">
                        MESH_DENSITY: 468pt<br />
                        LATENCY: 12ms
                    </div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-chronex-accent animate-ping" />
                        <span className="text-[8px] font-mono text-chronex-accent">LIVE</span>
                    </div>
                </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="w-full grid grid-cols-2 gap-2">
                <div className="p-2 bg-white/5 rounded border border-white/10 flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase">Integrity Score</span>
                    <div className="flex items-center gap-2 mt-1">
                        <Activity size={14} className={metrics.score > 80 ? "text-chronex-accent" : "text-orange-500"} />
                        <span className="text-xl font-bold font-mono text-white">{metrics.score}%</span>
                    </div>
                </div>
                <div className="p-2 bg-white/5 rounded border border-white/10 flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase">Head Tilt</span>
                    <div className="flex items-center gap-2 mt-1">
                        {metrics.tilt === 0 ? <CheckCircle size={14} className="text-chronex-accent" /> : <AlertTriangle size={14} className="text-yellow-500" />}
                        <span className="text-xl font-bold font-mono text-white">{metrics.tilt}°</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            {metrics.issues.length > 0 && (
                <div className="w-full p-2 bg-red-500/10 border border-red-500/20 rounded flex items-center justify-center gap-2 animate-pulse">
                    <AlertTriangle size={14} className="text-red-400" />
                    <span className="text-xs font-bold text-red-200 uppercase">{metrics.issues[0]}</span>
                </div>
            )}
        </div>
    );
}
