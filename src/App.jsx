import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SkeletonMirror } from './modules/vision/SkeletonMirror';
import { SonicSanctuary } from './modules/music/SonicSanctuary';
import { KeyboardClicker } from './modules/audio/KeyboardClicker';
import { BreathingOrb } from './modules/wellness/BreathingOrb';
import { EyeGym } from './modules/wellness/EyeGym';
import { HydrationLevel } from './modules/wellness/HydrationLevel';
import { LevelSystem } from './modules/gamification/LevelSystem';
import { LiquidTimer } from './modules/timer/LiquidTimer';
import { AICoach } from './modules/assistant/AICoach';
import { PerformanceChart } from './components/PerformanceChart';
import { MoodSelector } from './components/MoodSelector';
import { AITaskbar } from './components/AITaskbar';
import { PostureDetail } from './modules/vision/PostureDetail';
import { ReflexGame } from './modules/game/ReflexGame';
import { DailyReport } from './modules/report/DailyReport';
import { PostureAlert } from './components/PostureAlert';
import { useAudioAlert } from './hooks/useAudioAlert';
import { usePostureStore } from './modules/vision/PostureContext';
import { Zap, Activity, LayoutDashboard, ScanEye, Gamepad2, FileText, Wind, Keyboard, Maximize2, Minimize2 } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen text-white bg-black p-8">
                    <h1 className="text-red-500 text-3xl font-bold mb-4">CRITICAL SYSTEM ERROR</h1>
                    <p className="font-mono text-sm text-gray-400 max-w-2xl text-center mb-6">
                        {this.state.error?.toString()}
                    </p>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg">
                        REBOOT SYSTEM
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    const [contextData, setContextData] = useState(null);
    const [view, setView] = useState('dashboard'); // 'dashboard', 'analyzer', 'game', 'report', 'breathing'
    const [eyeGymActive, setEyeGymActive] = useState(false);
    const [zenMode, setZenMode] = useState(false);
    const [activeCamera, setActiveCamera] = useState('skeleton'); // 'skeleton' | 'face' | null
    
    const { alertState, setAlertState } = usePostureStore();

    const [pendingSwitch, setPendingSwitch] = useState(null); // 'skeleton' | 'face' | null
    const [showConfirm, setShowConfirm] = useState(false);

    // SAFE CAMERA SWITCHING
    const switchCamera = (newCamera, force = false) => {
        if (activeCamera === newCamera) return;

        if (!force && activeCamera !== null) {
            setPendingSwitch(newCamera);
            setShowConfirm(true);
            return;
        }

        setActiveCamera(null); // Unmount current
        setTimeout(() => {
            setActiveCamera(newCamera);
            setPendingSwitch(null);
            setShowConfirm(false);
        }, 600);
    };
    
    const { playNotification, playSuccess } = useAudioAlert();

    useEffect(() => {
        window.onerror = (msg, url, line, col, error) => {
            console.log("ERROR:", msg, "at", line + ":" + col);
        };

        // Hydration Reminder every 15 minutes
        const HYDRATION_INTERVAL = 15 * 60 * 1000;
        
        const hydrationTimer = setInterval(() => {
            setContextData(prev => ({
                ...prev,
                alert: true,
                alertMessage: "Hydration Reminder: Drink water"
            }));
            try { playNotification(); } catch (e) {}
        }, HYDRATION_INTERVAL);

        return () => {
            clearInterval(hydrationTimer);
            window.onerror = null;
        };
    }, [playNotification]);

    const handleAlertDismiss = () => {
        if (contextData?.alertMessage?.toLowerCase().includes('water')) {
            // "Water Drank" logic
            const history = JSON.parse(localStorage.getItem('chronex_daily_log') || '[]');
            history.push({
                timestamp: Date.now(),
                type: 'water',
                status: 'Optimal'
            });
            localStorage.setItem('chronex_daily_log', JSON.stringify(history));
            try { playSuccess(); } catch (e) {} // Play confirmation sound
        }
        setContextData(prev => ({ ...prev, alert: false }));
        setAlertState({ isAlert: false, message: "" });
    };

    return (
        <div className="min-h-screen bg-chronex-bg text-white font-sans selection:bg-chronex-accent selection:text-black relative">

            {/* OVERLAYS */}
            {eyeGymActive && <EyeGym onClose={() => setEyeGymActive(false)} />}

            {/* ALERTS */}
            <PostureAlert
                active={contextData?.alert === true || alertState.isAlert}
                message={contextData?.alert === true ? contextData.alertMessage : alertState.message}
                onDismiss={handleAlertDismiss}
            />

            {/* Camera Switch Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
                    <div className="glass-panel p-8 max-w-md w-full mx-4 flex flex-col items-center text-center border-chronex-accent/20">
                        <div className="w-16 h-16 rounded-full bg-chronex-accent/10 flex items-center justify-center mb-6 border border-chronex-accent/20">
                            <ScanEye className="text-chronex-accent" size={32} />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Camera Conflict Detected</h2>
                        <p className="text-gray-400 text-sm mb-8">
                            Switch camera from <span className="text-white font-bold">{activeCamera === 'skeleton' ? 'Dashboard' : 'Biometric Lab'}</span> to <span className="text-white font-bold">{pendingSwitch === 'skeleton' ? 'Dashboard' : 'Biometric Lab'}</span>? 
                            This will restart the biometric link.
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => {
                                    setShowConfirm(false);
                                    setPendingSwitch(null);
                                }}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all"
                            >
                                CANCEL
                            </button>
                            <button 
                                onClick={() => switchCamera(pendingSwitch, true)}
                                className="flex-1 px-4 py-3 bg-chronex-accent text-black rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all"
                            >
                                CONFIRM SWITCH
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Background Gradients */}
            <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-chronex-accent/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

            {/* Floating Taskbar */}
            <AITaskbar />

            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="max-w-[1920px] mx-auto p-4 md:p-8 min-h-screen grid grid-cols-12 grid-rows-[auto_1fr] gap-4"
            >

                {/* HEADER */}
                <header className="col-span-12 flex items-center justify-between py-4 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md hover:border-chronex-accent/50 transition-colors">
                            <Zap className="text-chronex-accent fill-chronex-accent" size={24} />
                        </div>
                        {!zenMode && (
                            <div>
                                <h1 className="text-3xl font-bold tracking-tighter leading-none">CHRONEX</h1>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-chronex-accent rounded-full animate-pulse" />
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">System v3.0</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* View Switcher / Zen Toggle */}
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md transition-all">
                        {zenMode ? (
                            <button
                                onClick={() => setZenMode(false)}
                                className="px-4 py-2 rounded-lg bg-red-400 text-black font-bold flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(255,100,100,0.5)] animate-pulse"
                            >
                                <Minimize2 size={16} /> EXIT ZEN
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setView('dashboard');
                                        switchCamera('skeleton');
                                    }}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-chronex-accent text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <LayoutDashboard size={16} /> Dashboard
                                </button>
                                <button
                                    onClick={() => {
                                        setView('analyzer');
                                        switchCamera('face');
                                    }}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${view === 'analyzer' ? 'bg-chronex-accent text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <ScanEye size={16} /> Biometric Lab
                                </button>
                                <button
                                    onClick={() => setView('report')}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${view === 'report' ? 'bg-chronex-accent text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <FileText size={16} /> Daily Report
                                </button>
                                <button
                                    onClick={() => setView('game')}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${view === 'game' ? 'bg-chronex-accent text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Gamepad2 size={16} /> Neural Break
                                </button>
                                <button
                                    onClick={() => setView('breathing')}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${view === 'breathing' ? 'bg-chronex-accent text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Wind size={16} /> Breathe
                                </button>
                                <button
                                    onClick={() => setZenMode(true)}
                                    className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-purple-400 hover:bg-purple-500/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
                                >
                                    <Maximize2 size={16} /> Zen Mode
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        {!zenMode && <LevelSystem />}
                        <span className="text-chronex-accent font-bold uppercase tracking-wider text-sm">Optimal</span>
                    </div>
                </header>

                {/* LEFT COLUMN - SENSORS & METRICS */}
                <div className={`col-span-12 lg:col-span-3 flex flex-col gap-4 min-h-[600px] h-full transition-all duration-1000 ${zenMode ? '-translate-x-[200%] opacity-0 w-0' : ''}`}>
                    {/* Vision Module */}
                    {/* Vision Module - Controlled by activeCamera state to prevent hardware locks */}
                    <div className="flex-none">
                        <SkeletonMirror
                            onUpdate={setContextData}
                            isActive={activeCamera === 'skeleton'}
                            onActivate={() => switchCamera('skeleton')}
                        />
                    </div>

                    <div className="flex-none">
                        <SonicSanctuary />
                    </div>

                    <div className="flex-none">
                        <KeyboardClicker />
                    </div>

                    <div className="flex-none">
                        <HydrationLevel />
                    </div>

                    <div className="flex-none">
                        <button
                            onClick={() => setEyeGymActive(true)}
                            className="w-full glass-panel p-4 flex items-center justify-between group hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-full text-chronex-accent">
                                    <ScanEye size={20} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-bold text-white">Eye Gym</h3>
                                    <p className="text-[10px] text-gray-500">20-20-20 Rule</p>
                                </div>
                            </div>
                            <div className="px-2 py-1 bg-chronex-accent/20 text-chronex-accent text-[10px] uppercase font-bold rounded">
                                Start
                            </div>
                        </button>
                    </div>

                    <div className="glass-panel p-6 flex-1 flex flex-col justify-center items-center relative overflow-hidden group min-h-[150px]">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-chronex-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Activity className="text-chronex-accent mb-4 opacity-50" size={32} />
                        <span className="label-text mb-2">Cognitive Load</span>
                        <span className="text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                            {contextData?.focusScore || 0}<span className="text-2xl text-chronex-accent relative top-[-20px]">%</span>
                        </span>
                    </div>
                </div>

                {/* CENTER COLUMN - DYNAMIC CONTENT */}
                <div className={`col-span-12 ${zenMode ? 'lg:col-span-12' : 'lg:col-span-6'} flex flex-col gap-4 h-full transition-all duration-1000`}>
                    {view === 'dashboard' && (
                        <>
                            <div className="flex-1 relative min-h-[300px]">
                                <LiquidTimer />
                            </div>
                            <div className="h-1/3 min-h-[250px]">
                                <PerformanceChart newData={contextData} />
                            </div>
                        </>
                    )}

                    {view === 'analyzer' && (
                        <div className="h-full min-h-[500px]">
                            <PostureDetail
                                isActive={activeCamera === 'face'}
                                onActivate={() => switchCamera('face')}
                            />
                        </div>
                    )}

                    {view === 'report' && (
                        <div className="h-full min-h-[500px]">
                            <DailyReport />
                        </div>
                    )}

                    {view === 'game' && (
                        <div className="h-full min-h-[500px]">
                            <ReflexGame />
                        </div>
                    )}

                    {view === 'breathing' && (
                        <div className="h-full min-h-[500px] flex items-center justify-center">
                            <BreathingOrb />
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN - INTELLIGENCE */}
                <div className={`col-span-12 lg:col-span-3 h-full min-h-[600px] transition-all duration-1000 ${zenMode ? 'translate-x-[200%] opacity-0 w-0' : ''}`}>
                    <AICoach contextData={contextData} />
                </div>

            </motion.main>
        </div>
    );
}

import { PostureProvider } from './modules/vision/PostureContext';

export default function AppWithErrorBoundary() {
    return (
        <ErrorBoundary>
            <PostureProvider>
                <App />
            </PostureProvider>
        </ErrorBoundary>
    );
}

// End of App component