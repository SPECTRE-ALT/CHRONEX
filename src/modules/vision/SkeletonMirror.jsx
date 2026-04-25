import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { useAudioAlert } from '../../hooks/useAudioAlert';
import { Camera } from '@mediapipe/camera_utils';
import { Scan, AlertTriangle, CheckCircle, Activity, Crosshair, Target, Lock } from 'lucide-react';

const validateCalibration = (landmarks) => {
    if (!landmarks || !landmarks[0]) return "Face not clearly visible";
    return null;
};

const normalizeLandmarks = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return null;

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

    // Center point (Shoulder Midpoint)
    const centerX = (leftShoulder.x + rightShoulder.x) / 2;
    const centerY = (leftShoulder.y + rightShoulder.y) / 2;

    // Current torso length
    const hipX = (leftHip.x + rightHip.x) / 2;
    const hipY = (leftHip.y + rightHip.y) / 2;
    const torsoLength = Math.sqrt(Math.pow(centerX - hipX, 2) + Math.pow(centerY - hipY, 2));
    
    // Target normalized torso length (e.g. 0.4 of screen height)
    const targetTorsoLength = 0.4;
    const scale = torsoLength > 0 ? targetTorsoLength / torsoLength : 1;

    // Center it horizontally and slightly high vertically
    const screenCenterX = 0.5;
    const screenCenterY = 0.3;

    return landmarks.map(p => ({
        ...p,
        x: ((p.x - centerX) * scale) + screenCenterX,
        y: ((p.y - centerY) * scale) + screenCenterY,
    }));
};

const extractRelativeMetrics = (landmarks) => {
    const nose = landmarks[0];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip || leftShoulder.visibility < 0.5) return null;

    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
    const hipY = (leftHip.y + rightHip.y) / 2;
    const hipX = (leftHip.x + rightHip.x) / 2;

    const shoulderWidth = Math.sqrt(Math.pow(rightShoulder.x - leftShoulder.x, 2) + Math.pow(rightShoulder.y - leftShoulder.y, 2)) || 0.1;
    const spineLength = Math.sqrt(Math.pow(shoulderX - hipX, 2) + Math.pow(shoulderY - hipY, 2)) || 0.1;

    // Relative metrics
    const neckRatio = (shoulderY - nose.y) / shoulderWidth; 
    const earSlope = (rightEar && leftEar) ? (Math.abs(leftEar.y - rightEar.y) / shoulderWidth) : 0;
    const spineTilt = (shoulderX - hipX) / spineLength; // 0 if perfectly vertical

    return { neckRatio, earSlope, spineTilt };
};

import { usePostureStore } from './PostureContext';

export function SkeletonMirror({ onUpdate, isActive = true, onActivate }) {
    const { baselineRef, latestLandmarksRef, lastAlertTimeRef, setAlertState, similarityScore, setSimilarityScore } = usePostureStore();
    
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const poseRef = useRef(null);
    const badPostureStartTimeRef = useRef(null);
    const lastLogTimeRef = useRef(0);
    const prevAlertRef = useRef(false);
    const retryCountRef = useRef(0);
    const lastMetricsUpdateRef = useRef(0);
    const skeletonReadyRef = useRef(false);

    const [status, setStatus] = useState("Initializing Holographic Link...");
    const [calibration, setCalibration] = useState(null);
    const [validationError, setValidationError] = useState(null);
    const [metrics, setMetrics] = useState({ score: 100, status: 'Optimal', issues: [] });
    const [cameraError, setCameraError] = useState(false);
    const [cameraKey, setCameraKey] = useState(0);
    const [isModelReady, setIsModelReady] = useState(false);
    const [countdown, setCountdown] = useState(null);

    const { playAlert, playSuccess, playError, playWarning, startContinuousBeep, stopContinuousBeep } = useAudioAlert();

    const handleCameraError = () => {
        if (retryCountRef.current < 1) {
            retryCountRef.current += 1;
            setCameraKey(k => k + 1);
        } else {
            setCameraError(true);
        }
    };

    const drawSkeleton = useCallback((ctx, landmarks, width, height, isBadPosture, isGhost = false) => {
        // Style Configuration
        const goodColor = '#ccff00';
        const badColor = '#ff4444';
        const ghostColor = 'rgba(204, 255, 0, 0.5)'; // Green for ghost

        let mainColor = isBadPosture ? badColor : goodColor;
        if (isGhost) mainColor = ghostColor;

        ctx.lineWidth = isGhost ? 2 : 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = mainColor;
        ctx.fillStyle = mainColor;

        // Helper to get coords
        const getPoint = (index) => {
            if (!landmarks[index]) return null;
            return { x: landmarks[index].x * width, y: landmarks[index].y * height, v: landmarks[index].visibility };
        };

        const drawLine = (idx1, idx2) => {
            const p1 = getPoint(idx1);
            const p2 = getPoint(idx2);
            if (p1 && p2 && p1.v > 0.5 && p2.v > 0.5) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                if (isBadPosture && !isGhost) {
                    // Glitch effect ONLY for live bad posture
                    ctx.lineTo(p1.x + (Math.random() - 0.5) * 10, (p1.y + p2.y) / 2 + (Math.random() - 0.5) * 10);
                    ctx.lineTo(p2.x, p2.y);
                } else {
                    ctx.lineTo(p2.x, p2.y);
                }
                ctx.stroke();
            }
        };

        const drawJoint = (idx) => {
            const p = getPoint(idx);
            if (p && p.v > 0.5) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, isGhost ? 2 : 4, 0, 2 * Math.PI);
                ctx.fill();
            }
        };

        // --- DRAWING THE STICK FIGURE ---
        if (POSE_CONNECTIONS) {
            POSE_CONNECTIONS.forEach(([i, j]) => {
                const p1 = getPoint(i);
                const p2 = getPoint(j);
                if (p1 && p2 && p1.v > 0.5 && p2.v > 0.5) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    if (isBadPosture && !isGhost) {
                        ctx.lineTo(p1.x + (Math.random() - 0.5) * 10, (p1.y + p2.y) / 2 + (Math.random() - 0.5) * 10);
                        ctx.lineTo(p2.x, p2.y);
                    } else {
                        ctx.lineTo(p2.x, p2.y);
                    }
                    ctx.stroke();
                }
            });
        }
        
        // Joints







        // Joints
        [0, 11, 12, 13, 14, 15, 16, 23, 24].forEach(drawJoint);

    }, []);



    const analyzePosture = useCallback((landmarks) => {
        let currentScore = 100;
        let issues = [];
        let similarity = 1.0;
        const cal = baselineRef.current;

        // --- CALIBRATED MODE ---
        if (cal && cal.normalizedLandmarks) {
            const currentNormalized = normalizeLandmarks(landmarks);
            if (currentNormalized) {
                const keyIndices = [0, 7, 8, 11, 12]; // nose, left ear, right ear, left shoulder, right shoulder
                let totalDist = 0;
                let count = 0;

                keyIndices.forEach(idx => {
                    const p1 = currentNormalized[idx];
                    const p2 = cal.normalizedLandmarks[idx];
                    if (p1 && p2 && p1.visibility > 0.5) {
                        const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                        totalDist += dist;
                        count++;
                    }
                });

                if (count > 0) {
                    const avgDist = totalDist / count;
                    similarity = Math.max(0, 1.0 - (avgDist * 2));
                    setSimilarityScore(similarity);
                    
                    // DEBUG: log similarity score every 1s approximately to avoid spam
                    if (Date.now() % 1000 < 30) {
                        console.log(`[DEBUG] Similarity Score: ${similarity.toFixed(2)}`);
                    }

                    const totalDriftPercent = (1.0 - similarity) * 100;
                    currentScore = Math.max(0, 100 - totalDriftPercent);

                    if (similarity < 0.9) {
                        issues.push("Postural Deviation");
                    }
                }
            }
        } else {
            // Uncalibrated heuristics (fallback)
            const nose = landmarks[0];
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];
            const leftEar = landmarks[7];
            const rightEar = landmarks[8];

            const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
            const noseToShoulderDist = shoulderY - nose.y;

            if (noseToShoulderDist < 0.08) { 
                currentScore -= 40;
                issues.push("Tech Neck");
            }

            const earSlope = Math.abs(leftEar.y - rightEar.y);
            if (earSlope > 0.08) { 
                currentScore -= 20;
                issues.push("Head Tilt");
            }
            
            similarity = currentScore / 100;
        }

        const deviation = 100 - currentScore;
        const isWarning = deviation >= 10;
        const isCritical = similarity < 0.9;
        const isBad = isWarning || isCritical;

        // Debounce logic
        if (isBad) {
            if (!badPostureStartTimeRef.current) {
                badPostureStartTimeRef.current = Date.now();
            }

            const duration = Date.now() - badPostureStartTimeRef.current;

            // Wait 2 seconds before warning to allow natural movement back
            if (duration > 2000) {
                const now = Date.now();
                // Alert throttling (5 seconds cooldown)
                if (now - lastAlertTimeRef.current > 5000) {
                    if (isCritical) {
                        try { playAlert(); } catch (e) {/*ignore*/ }
                    } else if (isWarning) {
                        if (typeof playWarning === 'function') {
                            try { playWarning(); } catch (e) {}
                        }
                    }
                    lastAlertTimeRef.current = now;
                    setAlertState({ isAlert: true, message: isCritical ? "CRITICAL DEVIATION" : "Sit straight" });
                    
                    console.log(`[DEBUG] Alert Triggered! Similarity: ${similarity.toFixed(2)} (<0.9)`);
                    
                    // Trigger UI alert via onUpdate for Critical or Warning
                    if (onUpdate) {
                        onUpdate({
                            postureScore: Math.round(currentScore),
                            focusScore: 90,
                            alert: true,
                            alertMessage: isCritical ? "CRITICAL DEVIATION: Correct Posture Immediately" : "Sit straight",
                            alertType: isCritical ? "critical" : "warning",
                            timestamp: Date.now()
                        });
                    }
                    
                    if (currentScore < 90) {
                        startContinuousBeep();
                    } else {
                        stopContinuousBeep();
                    }
                }
            }
        } else {
            badPostureStartTimeRef.current = null;
            stopContinuousBeep();
            if (onUpdate && prevAlertRef.current) {
                // Clear alert if we just recovered
                onUpdate({ alert: false, alertMessage: "", timestamp: Date.now() });
            }
        }
        
        prevAlertRef.current = isBad && (Date.now() - (badPostureStartTimeRef.current || Date.now()) > 2000);

        const now = Date.now();
        if (now - lastMetricsUpdateRef.current > 150) {
            setMetrics({
                score: Math.max(0, Math.round(currentScore)),
                status: isCritical ? 'Critical' : isWarning ? 'Warning' : 'Optimal',
                issues: issues.length > 0 ? issues : []
            });
            
            // Always pass non-alert updates for graphs/tracking
            if (onUpdate && !prevAlertRef.current) {
                onUpdate({
                    postureScore: Math.max(0, Math.round(currentScore)),
                    focusScore: 90,
                    alert: false,
                    timestamp: now
                });
            }
            lastMetricsUpdateRef.current = now;
        }

        // Periodic Daily Log (Every 15s)
        if (!lastLogTimeRef.current || now - lastLogTimeRef.current > 15000) {
            try {
                const history = JSON.parse(localStorage.getItem('chronex_daily_log') || '[]');
                history.push({
                    timestamp: now,
                    score: Math.max(0, Math.round(currentScore)),
                    issue: issues.length > 0 ? issues[0] : "None",
                    status: isCritical ? 'Bad' : isWarning ? 'Warning' : 'Good'
                });
                if (history.length > 200) history.shift();
                localStorage.setItem('chronex_daily_log', JSON.stringify(history));
                lastLogTimeRef.current = now;
            } catch (err) {
                console.error("Storage Error", err);
            }
        }

        return isBad;
    }, [onUpdate, playAlert, playWarning, startContinuousBeep, stopContinuousBeep]);



    const handleCalibrate = () => {
        if (latestLandmarksRef.current && latestLandmarksRef.current.length > 0) {
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
                    const metrics = extractRelativeMetrics(latestLandmarksRef.current);
                    const normalizedLandmarks = normalizeLandmarks(latestLandmarksRef.current);
                    if (metrics && normalizedLandmarks) {
                        const calData = { metrics, normalizedLandmarks };
                        setCalibration(calData);
                        baselineRef.current = calData;
                        console.log("[DEBUG] Baseline Set:", calData);
                        try { playSuccess(); } catch (e) { }
                    } else {
                        setValidationError("Subject not clearly visible.");
                        try { playError(); } catch (e) { }
                    }
                    setTimeout(() => setCountdown(null), 1000);
                }
            }, 1000);
        } else {
            setValidationError("AI not ready. Please wait.");
            try { playError(); } catch (e) { }
        }
    };

    useEffect(() => {
        if (!isActive) return;

        const delayTimer = setTimeout(() => {
            skeletonReadyRef.current = true;
        }, 2000);

        if (!poseRef.current) {
            const pose = new Pose({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
            });
            pose.setOptions({
                modelComplexity: 0,
                smoothLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            pose.onResults((results) => {
                if (!isModelReady) setIsModelReady(true);
                if (!canvasRef.current || !webcamRef.current || !webcamRef.current.video) return;
                const video = webcamRef.current.video;
                if (video.readyState !== 4) return;
                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, videoWidth, videoHeight);
                
                if (baselineRef.current && baselineRef.current.normalizedLandmarks) {
                    drawSkeleton(ctx, baselineRef.current.normalizedLandmarks, videoWidth, videoHeight, false, true);
                }
                if (results.poseLandmarks && results.poseLandmarks.length > 0) {
                    const safeCopy = results.poseLandmarks.map(p => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility }));
                    latestLandmarksRef.current = safeCopy;
                    const isBad = analyzePosture(results.poseLandmarks);
                    if (skeletonReadyRef.current) {
                        drawSkeleton(ctx, results.poseLandmarks, videoWidth, videoHeight, isBad, false);
                    }
                    setStatus(baselineRef.current ? "Target Locked" : (skeletonReadyRef.current ? "Calibrate Posture" : "Acquiring link..."));
                } else {
                    setStatus("No Subject Detected");
                }
            });
            poseRef.current = pose;
        }

        let isProcessing = false;
        let animationFrameId;

        const loop = async () => {
            if (!isProcessing && webcamRef.current?.video?.readyState === 4 && !cameraError) {
                isProcessing = true;
                try {
                    if (poseRef.current) await poseRef.current.send({ image: webcamRef.current.video });
                } catch (e) {}
                isProcessing = false;
            }
            animationFrameId = requestAnimationFrame(loop);
        };
        animationFrameId = requestAnimationFrame(loop);

        const handleVisibilityChange = () => {
            if (document.hidden) cancelAnimationFrame(animationFrameId);
            else {
                animationFrameId = requestAnimationFrame(loop);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopContinuousBeep();
            clearTimeout(delayTimer);
            cancelAnimationFrame(animationFrameId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (poseRef.current) {
                try { poseRef.current.close(); } catch (e) {}
                poseRef.current = null;
            }
            setIsModelReady(false);
        };
    }, [isActive, cameraError, cameraKey, analyzePosture, drawSkeleton, stopContinuousBeep]); // Only re-run if active state or camera mounts change

    return (
        <div className="glass-panel p-4 flex flex-col items-center gap-4 relative overflow-hidden group min-h-[300px]">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <Scan size={16} className={`text-chronex-accent ${isActive ? "animate-pulse" : "opacity-50"}`} />
                    <span className="text-xs font-mono uppercase tracking-widest text-white/70">
                        {isActive ? (calibration ? "Holo-Lock Engaged" : "Skelly-Link v1") : "Signal Paused"}
                    </span>
                </div>
                {isActive && (
                    <button
                        onClick={handleCalibrate}
                        disabled={!isModelReady}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded flex items-center gap-2 transition-all hover:scale-105 active:scale-95
                        ${(!isModelReady) ? 'opacity-50 cursor-not-allowed bg-white/5 text-gray-500' :
                            calibration ? 'bg-chronex-accent text-black shadow-[0_0_15px_#ccff00]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {!isModelReady ? (
                            <span>Loading AI...</span>
                        ) : (
                            <>
                                {calibration ? <Lock size={10} /> : <Target size={10} />}
                                {calibration ? "Recalibrate" : "Set Posture"}
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Visualizer Area */}
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/5 shadow-inner">
                {isActive ? (
                    <>
                        {/* Real webcam hidden or dimmed heavily */}
                        <Webcam
                            key={cameraKey}
                            ref={webcamRef}
                            audio={false}
                            className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale contrast-125 pointer-events-none"
                            videoConstraints={{ 
                                width: 640, 
                                height: 480, 
                                frameRate: { ideal: 24, max: 30 },
                                facingMode: "user" 
                            }}
                            onUserMediaError={handleCameraError}
                            onUserMedia={() => {
                                setCameraError(false);
                                retryCountRef.current = 0;
                                if (webcamRef.current && webcamRef.current.video) {
                                    webcamRef.current.video.play().catch(e => console.log("Video play error:", e));
                                }
                            }}
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Camera Error State */}
                        {cameraError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-[60] backdrop-blur-sm animate-in fade-in">
                                <AlertTriangle className="text-red-500 mb-2 animate-pulse" size={32} />
                                <p className="text-white font-bold text-sm tracking-wider uppercase">Camera Access Denied</p>
                                <p className="text-[10px] text-gray-400 mt-2 max-w-[80%] text-center">
                                    Please allow camera permissions in your browser settings to enable biometric tracking.
                                </p>
                            </div>
                        )}

                            {/* HUD Overlay */}
                        <div className="absolute inset-0 pointer-events-none z-40">
                            {/* Countdown Overlay */}
                            {countdown !== null && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-50 backdrop-blur-sm">
                                    <div className="text-9xl font-bold text-chronex-accent animate-ping drop-shadow-[0_0_20px_rgba(204,255,0,0.8)]">
                                        {countdown}
                                    </div>
                                </div>
                            )}
                            <div className="absolute top-2 left-2 text-[8px] font-mono text-chronex-accent/50">
                                SKELETAL_Nodes: 33<br />
                                MODE: {calibration ? "DIFFERENTIAL" : "HEURISTIC"}
                            </div>

                            {/* Validation Error Toast */}
                            {validationError && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500/90 backdrop-blur text-white px-6 py-4 rounded-xl shadow-2xl border border-red-400 animate-in fade-in slide-in-from-bottom-4 z-50 text-center">
                                    <AlertTriangle size={32} className="mx-auto mb-2 text-white" />
                                    <h3 className="text-lg font-bold uppercase mb-1">Calibration Failed</h3>
                                    <p className="text-sm font-mono">{validationError}</p>
                                    <p className="text-[10px] mt-2 opacity-70">Please sit straight and try again</p>
                                </div>
                            )}

                            {!calibration && !validationError && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black/80 backdrop-blur-sm p-4 rounded-xl border border-chronex-accent/30 text-center animate-in fade-in zoom-in duration-500">
                                        <Target className="text-chronex-accent mx-auto mb-2" size={32} />
                                        <p className="text-white text-sm font-bold">Sit Straight</p>
                                        <p className="text-gray-400 text-xs mb-3">Then click "Set Posture"</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 p-6 text-center">
                        <Scan size={48} className="text-white/20 mb-4" />
                        <h4 className="text-white font-bold mb-2">Camera Paused</h4>
                        <p className="text-xs text-gray-500 mb-6">Camera active in Biometric Lab.</p>
                        <button
                            onClick={onActivate}
                            className="bg-chronex-accent/20 text-chronex-accent border border-chronex-accent/50 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-chronex-accent hover:text-black transition-all"
                        >
                            Resume Monitor
                        </button>
                    </div>
                )}
            </div>

            {/* Live Metrics Grid */}
            <div className="w-full grid grid-cols-2 gap-2">
                <div className="p-2 bg-white/5 rounded border border-white/10 flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase">Spine Integrity</span>
                    <div className="flex items-center gap-2 mt-1">
                        <Activity size={14} className={metrics.score > 70 ? "text-chronex-accent" : "text-orange-500"} />
                        <span className="text-xl font-bold font-mono text-white">{metrics.score}%</span>
                    </div>
                </div>
                <div className="p-2 bg-white/5 rounded border border-white/10 flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase">Status</span>
                    <div className="flex items-center gap-2 mt-1">
                        {metrics.score > 70 ? <CheckCircle size={14} className="text-chronex-accent" /> : <AlertTriangle size={14} className="text-red-500" />}
                        <span className={`text-sm font-bold font-mono uppercase ${metrics.score > 70 ? "text-white" : "text-red-400"}`}>{metrics.issues[0] || "Aligned"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
