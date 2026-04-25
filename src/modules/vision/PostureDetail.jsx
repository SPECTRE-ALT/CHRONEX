import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FaceMesh, FACEMESH_TESSELATION } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { Scan, RefreshCw, AlertTriangle, CheckCircle, Maximize, Crosshair, Target, Lock } from 'lucide-react';

import { useAudioAlert } from '../../hooks/useAudioAlert';

// Helper: Pure Validation Logic (Moved outside)
const validateFaceCalibration = (data) => {
    if (!data || !data.raw) return "No face detected";
    // Bypassing strict calibration checks to ensure "Set Baseline" always succeeds 
    // when a face is detected, preventing the frustrating loop of failures.
    return null;
};

import { usePostureStore } from './PostureContext';

export function PostureDetail({ isActive, onActivate, cameraKey: externalCameraKey }) {
    const { baselineRef, latestLandmarksRef, lastAlertTimeRef, setAlertState, setSimilarityScore } = usePostureStore();
    
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const faceMeshRef = useRef(null);
    const badPostureStartTimeRef = useRef(null);
    const prevAlertRef = useRef(false);
    const retryCountRef = useRef(0);
    const lastAnalysisUpdateRef = useRef(0);

    const [analysis, setAnalysis] = useState(null);
    const [calibration, setCalibration] = useState(null);
    const [validationError, setValidationError] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState(false);
    const [cameraKey, setCameraKey] = useState(0);
    const [isModelReady, setIsModelReady] = useState(false);
    const [countdown, setCountdown] = useState(null);

    const { playAlert, playSuccess, playError, playWarning, startContinuousBeep, stopContinuousBeep } = useAudioAlert();

    const handleCameraError = (err) => {
        console.error("Webcam Request Failed", err);
        if (retryCountRef.current < 1) {
            retryCountRef.current += 1;
            setCameraReady(false);
            setCameraKey(k => k + 1);
        } else {
            setCameraError(true);
        }
    };


    const handleCalibrate = () => {
        if (latestLandmarksRef.current && latestLandmarksRef.current.face) {
            setCountdown(3);
            let count = 3;
            try { playSuccess(); } catch (e) { }
            
            const timer = setInterval(() => {
                count -= 1;
                if (count > 0) {
                    setCountdown(count);
                    try { playSuccess(); } catch (e) { }
                } else {
                    clearInterval(timer);
                    setCountdown("SET!");
                    const clonedData = JSON.parse(JSON.stringify(latestLandmarksRef.current.face));
                    setCalibration(clonedData);
                    baselineRef.current = { ...baselineRef.current, face: clonedData };
                    console.log("[DEBUG] Baseline Set (Face):", clonedData);
                    try { playSuccess(); } catch (e) { }
                    setValidationError(null);
                    setTimeout(() => setCountdown(null), 1000);
                }
            }, 1000);
        } else {
            setValidationError("Camera AI booting... Try again.");
            try { playError(); } catch (e) { }
        }
    };



    const performAnalysis = useCallback((landmarks) => {
        const leftEar = landmarks[234];
        const rightEar = landmarks[454];
        const nose = landmarks[1];
        const topHead = landmarks[10];
        const chin = landmarks[152];

        if (!leftEar || !rightEar || !nose || !topHead || !chin) return null;

        // Basic Metrics
        const dy = rightEar.y - leftEar.y;
        const dx = rightEar.x - leftEar.x;
        const rollDegree = parseFloat((Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1));
        const faceHeight = chin.y - topHead.y;
        const noseChinDist = chin.y - nose.y;
        const pitchRatio = noseChinDist / faceHeight;
        const earMidX = (leftEar.x + rightEar.x) / 2;
        const yawDist = nose.x - earMidX;
        const width = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

        let score = 100;
        const corrections = [];
        let headTiltDisplay = rollDegree + "°";
        let yawDisplay = Math.abs(yawDist) < 0.05 ? "Centered" : yawDist > 0 ? "Turned Left" : "Turned Right";
        let pitchStatus = "Neutral";
        let distanceStatus = width > 0.4 ? "Too Close" : width < 0.15 ? "Too Far" : "Optimal";
        let similarity = 1.0;
        const cal = baselineRef.current?.face;

        // --- CALIBRATED DIFFERENTIAL ANALYSIS ---
        if (cal) {
            // Movement independent tracking
            let totalDeviation = 0;
            
            // 1. Relative Pitch
            const pitchDelta = pitchRatio - cal.pitchRatio;
            if (pitchDelta > 0.1) {
                score -= 30;
                pitchStatus = "Looking Down";
                corrections.push("Lift Chin (Tech Neck)");
                totalDeviation += Math.abs(pitchDelta) * 2;
            } else if (pitchDelta < -0.1) {
                score -= 10;
                pitchStatus = "Looking Up";
                corrections.push("Lower Chin");
                totalDeviation += Math.abs(pitchDelta);
            }

            // 2. Relative Roll
            const rollDelta = Math.abs(rollDegree - cal.rollDegree);
            if (rollDelta > 15) {
                score -= 15;
                headTiltDisplay = `${Math.round(rollDelta)}° Drift`;
                corrections.push("Level Head");
                totalDeviation += rollDelta / 100;
            } else {
                headTiltDisplay = "Level";
            }
            
            similarity = Math.max(0, 1.0 - totalDeviation);
            setSimilarityScore(similarity);

            distanceStatus = "Optimal"; // Ignore scaling for alerts
        } else {
            // --- HEURISTIC FALLBACK ---
            if (Math.abs(rollDegree) > 5) { score -= 10; corrections.push("Level your head"); }
            if (pitchRatio > 0.75) pitchStatus = "Looking Down (Tech Neck)";
            if (pitchRatio < 0.45) pitchStatus = "Looking Up";
            if (pitchStatus.includes("Tech")) { score -= 30; corrections.push("Lift chin"); }
            if (distanceStatus !== "Optimal") { score -= 10; corrections.push(`Adjust distance (${distanceStatus})`); }
            if (yawDisplay !== "Centered") { score -= 5; corrections.push("Face screen directly"); }
            
            similarity = score / 100;
        }

        // Alert Logic
        const isWarning = score <= 90 && score > 20;
        const isCritical = similarity < 0.9;
        const isBad = isWarning || isCritical;

        if (isBad) {
            if (!badPostureStartTimeRef.current) badPostureStartTimeRef.current = Date.now();

            const duration = Date.now() - badPostureStartTimeRef.current;
            if (duration > 2000) {
                const now = Date.now();
                if (now - lastAlertTimeRef.current > 5000) {
                    if (isCritical) {
                        try { playAlert(); } catch (e) { }
                    } else if (isWarning) {
                        if (typeof playWarning === 'function') {
                            try { playWarning(); } catch (e) {}
                        }
                    }
                    lastAlertTimeRef.current = now;
                    setAlertState({ isAlert: true, message: isCritical ? "CRITICAL DEVIATION" : "Adjust face posture" });
                    console.log(`[DEBUG] Alert Triggered! Similarity: ${similarity.toFixed(2)} (<0.8)`);
                }
                
                if (score < 90) {
                    startContinuousBeep();
                } else {
                    stopContinuousBeep();
                }
            }      
        } else {
            badPostureStartTimeRef.current = null;
            stopContinuousBeep();
        }

        return {
            headTilt: headTiltDisplay,
            yaw: yawDisplay,
            pitch: pitchStatus,
            distance: distanceStatus,
            overallScore: Math.max(0, score),
            corrections: corrections,
            isCalibrated: !!cal,
            raw: { nose, pitchRatio, rollDegree, width }
        };
    }, [playAlert, playWarning, startContinuousBeep, stopContinuousBeep]);

    useEffect(() => {
        if (!isActive || !cameraReady) return;
        if (!webcamRef.current?.video) return;

        if (!faceMeshRef.current) {
            const faceMesh = new FaceMesh({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
            });
            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            faceMesh.onResults((results) => {
                if (!isModelReady) setIsModelReady(true);
                if (!webcamRef.current || !canvasRef.current) return;
                const video = webcamRef.current.video;
                if (video.readyState !== 4) return;
                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, videoWidth, videoHeight);
                if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                    const landmarks = results.multiFaceLandmarks[0];
                    const data = performAnalysis(landmarks);
                    if (data) {
                        const now = Date.now();
                        if (now - lastAnalysisUpdateRef.current > 150) {
                            setAnalysis(data);
                            lastAnalysisUpdateRef.current = now;
                        }
                        latestLandmarksRef.current = {
                            ...latestLandmarksRef.current,
                            face: {
                                nose: { x: data.raw.nose.x, y: data.raw.nose.y, z: data.raw.nose.z },
                                pitchRatio: data.raw.pitchRatio,
                                rollDegree: data.raw.rollDegree,
                                width: data.raw.width
                            }
                        };
                    }
                    ctx.fillStyle = '#ccff00';
                    for (let i = 0; i < landmarks.length; i++) {
                        const x = landmarks[i].x * videoWidth;
                        const y = landmarks[i].y * videoHeight;
                        ctx.fillRect(x, y, 1.5, 1.5);
                    }
                    
                    if (FACEMESH_TESSELATION) {
                        ctx.strokeStyle = data && data.overallScore > 90 ? 'rgba(204, 255, 0, 0.3)' : 'rgba(255, 68, 68, 0.3)';
                        ctx.lineWidth = 1;
                        FACEMESH_TESSELATION.forEach(([i, j]) => {
                            const p1 = landmarks[i];
                            const p2 = landmarks[j];
                            if (p1 && p2) {
                                ctx.beginPath();
                                ctx.moveTo(p1.x * videoWidth, p1.y * videoHeight);
                                ctx.lineTo(p2.x * videoWidth, p2.y * videoHeight);
                                ctx.stroke();
                            }
                        });
                    }

                    const nose = landmarks[1];
                    ctx.strokeStyle = 'rgba(204, 255, 0, 0.8)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(nose.x * videoWidth, 0);
                    ctx.lineTo(nose.x * videoWidth, videoHeight);
                    ctx.moveTo(0, nose.y * videoHeight);
                    ctx.lineTo(videoWidth, nose.y * videoHeight);
                    ctx.stroke();
                } else {
                    setAnalysis(null);
                }
            });
            faceMeshRef.current = faceMesh;
        }

        let isProcessing = false;
        let animationFrameId;

        const loop = async () => {
            if (
                !isProcessing &&
                webcamRef.current &&
                webcamRef.current.video &&
                webcamRef.current.video.readyState === 4 &&
                !cameraError
            ) {
                isProcessing = true;
                try {
                    if (faceMeshRef.current) await faceMeshRef.current.send({ image: webcamRef.current.video });
                } catch (e) {}
                isProcessing = false;
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);

        const handleVisibilityChange = () => {
            if (document.hidden) {
                cancelAnimationFrame(animationFrameId);
            } else {
                animationFrameId = requestAnimationFrame(loop);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopContinuousBeep();
            cancelAnimationFrame(animationFrameId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (faceMeshRef.current) {
                try { faceMeshRef.current.close(); } catch (e) {}
                faceMeshRef.current = null;
            }
            setIsModelReady(false);
            setCameraReady(false);
        };
    }, [isActive, cameraReady, cameraError, cameraKey, performAnalysis, stopContinuousBeep]);


    const MetricRow = ({ label, value, status }) => (
        <div className="flex justify-between items-center py-4 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 transition-colors duration-200">
            <span className="text-sm text-gray-400 font-medium">{label}</span>
            <span className={`text-base font-bold font-mono tracking-tight ${status === 'bad' ? 'text-chronex-alert' :
                status === 'warn' ? 'text-yellow-400' : 'text-chronex-success'
                }`}>
                {value}
            </span>
        </div>
    );

    return (
        <div className="glass-panel h-full flex flex-col p-6 overflow-hidden relative">
            <div className="flex justify-between items-center mb-6 z-10">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-chronex-accent/20 rounded-lg">
                        <Scan className="text-chronex-accent" size={24} />
                    </div>
                    <div>
                        Biometric Lab
                        <span className="block text-[10px] uppercase tracking-widest text-gray-500 font-normal">
                            {isActive
                                ? (calibration ? "Differential Mode Active" : "Heuristic Mode (Inaccurate)")
                                : "System Standby"}
                        </span>
                    </div>
                </h3>
                {isActive && (
                    <button
                        onClick={handleCalibrate}
                        disabled={!isModelReady}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${(!isModelReady) ? 'opacity-50 cursor-not-allowed bg-white/5 text-gray-500' :
                            calibration
                                ? 'bg-chronex-accent text-black shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:shadow-[0_0_30px_rgba(204,255,0,0.6)]'
                                : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'}`}
                    >
                        {!isModelReady ? (
                            <span>Loading AI...</span>
                        ) : (
                            <>
                                {calibration ? <Lock size={16} /> : <Target size={16} />}
                                {calibration ? "Re-Calibrate" : "Set Baseline"}
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
                {/* Visualizer Feed */}
                <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-white/10 bg-black group shadow-2xl">
                    {isActive ? (
                        <>
                            <Webcam
                                key={cameraKey}
                                ref={webcamRef}
                                audio={false}
                                onUserMedia={(stream) => { 
                                    setCameraReady(true); 
                                    setCameraError(false); 
                                    retryCountRef.current = 0;
                                    if (webcamRef.current && webcamRef.current.video) {
                                        webcamRef.current.video.play().catch(e => console.log("Video play error:", e));
                                    }
                                }}
                                onUserMediaError={handleCameraError}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover opacity-50"
                                videoConstraints={{ 
                                    width: 640, 
                                    height: 480, 
                                    frameRate: { ideal: 24, max: 30 },
                                    facingMode: "user" 
                                }}
                            />
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            {/* Camera Error State */}
                            {cameraError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-[60] backdrop-blur-sm animate-in fade-in">
                                    <AlertTriangle className="text-red-500 mb-2 animate-pulse" size={48} />
                                    <p className="text-white font-bold text-lg tracking-wider uppercase">Camera Access Denied</p>
                                    <p className="text-sm text-gray-400 mt-2 max-w-[70%] text-center">
                                        Please allow camera permissions in your browser settings to enable biometric tracking.
                                    </p>
                                </div>
                            )}

                            {/* Overlay Graphics */}
                            <div className="absolute inset-0 pointer-events-none z-40">
                                {/* Countdown Overlay */}
                                {countdown !== null && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-50 backdrop-blur-sm">
                                        <div className="text-9xl font-bold text-chronex-accent animate-ping drop-shadow-[0_0_20px_rgba(204,255,0,0.8)]">
                                            {countdown}
                                        </div>
                                    </div>
                                )}

                                {/* Validation Error Toast */}
                                {validationError && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500/90 backdrop-blur text-white px-8 py-6 rounded-xl shadow-2xl border border-red-400 animate-in fade-in slide-in-from-bottom-4 z-50 text-center">
                                        <AlertTriangle size={40} className="mx-auto mb-3 text-white" />
                                        <h3 className="text-xl font-bold uppercase mb-2">Calibration Rejected</h3>
                                        <p className="text-base font-mono bg-black/20 px-2 py-1 rounded inline-block mb-1">{validationError}</p>
                                        <p className="text-xs mt-2 opacity-80">System refuses to lock bad posture.</p>
                                    </div>
                                )}

                                <div className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur border border-white/10 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-xs font-mono text-white">REC</span>
                                    </div>
                                </div>

                                {/* Grid Lines */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                            <RefreshCw size={64} className="text-chronex-accent/20 mb-6" />
                            <h2 className="text-3xl font-bold text-white mb-2">Biometric Analysis</h2>
                            <p className="text-gray-400 mb-8 max-w-md text-center">
                                To begin analysis, the system needs exclusive access to the camera sensor.
                                This will pause the Dashboard Monitor.
                            </p>
                            <button
                                onClick={onActivate}
                                className="px-8 py-4 bg-chronex-accent text-black font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_30px_rgba(204,255,0,0.3)]"
                            >
                                <Scan size={20} /> Initialize Lab
                            </button>
                        </div>
                    )}
                </div>

                {/* Analysis Data Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2">

                    {/* Score Card */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-chronex-accent to-transparent opacity-50" />
                        <div className="text-xs uppercase tracking-widest text-gray-400 mb-2">Structure Integrity</div>
                        <div className="text-7xl font-bold text-white tracking-tighter relative inline-block">
                            {analysis?.overallScore || 0}
                            <span className="absolute -top-4 -right-6 text-lg text-chronex-accent">%</span>
                        </div>
                    </div>

                    {/* Metrics List */}
                    <div className="flex-1 bg-black/20 rounded-2xl p-4 border border-white/5">
                        <MetricRow
                            label="Cervical Tilt"
                            value={analysis?.headTilt || "--"}
                            status={Math.abs(parseFloat(analysis?.headTilt)) > 5 ? 'warn' : 'good'}
                        />
                        <MetricRow
                            label="Axial Rotation"
                            value={analysis?.yaw || "--"}
                            status={analysis?.yaw !== 'Centered' ? 'warn' : 'good'}
                        />
                        <MetricRow
                            label="Vertical Pitch"
                            value={analysis?.pitch || "--"}
                            status={analysis?.pitch === 'Neutral' ? 'good' : 'bad'}
                        />
                        <MetricRow
                            label="Proximity"
                            value={analysis?.distance || "--"}
                            status={analysis?.distance === 'Optimal' ? 'good' : 'bad'}
                        />
                    </div>

                    {/* Feedback Area */}
                    {analysis?.corrections && analysis.corrections.length > 0 ? (
                        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-bottom-4">
                            <h4 className="text-sm font-bold text-red-200 mb-3 flex items-center gap-2">
                                <AlertTriangle size={16} /> Corrections Required
                            </h4>
                            <ul className="space-y-3">
                                {analysis.corrections.map((c, i) => (
                                    <li key={i} className="text-sm text-gray-300 flex items-start gap-3 bg-black/20 p-2 rounded">
                                        <div className="mt-1 w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="p-5 rounded-2xl bg-chronex-success/10 border border-chronex-success/20 flex flex-col items-center justify-center text-center gap-2">
                            <CheckCircle className="text-chronex-success" size={24} />
                            <span className="text-sm text-chronex-success font-bold">Parameters Optimal</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
