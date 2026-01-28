import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VisionMonitor } from './modules/vision/VisionMonitor';
import { LiquidTimer } from './modules/timer/LiquidTimer';
import { AICoach } from './modules/assistant/AICoach';
import { PerformanceChart } from './components/PerformanceChart';
import { MoodSelector } from './components/MoodSelector';
import { AITaskbar } from './components/AITaskbar';
import { PostureDetail } from './modules/vision/PostureDetail';
import { ReflexGame } from './modules/game/ReflexGame';
import { DailyReport } from './modules/report/DailyReport';
import { PostureAlert } from './components/PostureAlert';
import { Zap, Activity, LayoutDashboard, ScanEye, Gamepad2, FileText } from 'lucide-react';

function App() {
    const [contextData, setContextData] = useState(null);
    const [view, setView] = useState('dashboard'); // 'dashboard', 'analyzer', 'game', 'report'

    return (
        <div className="min-h-screen bg-chronex-bg text-white font-sans selection:bg-chronex-accent selection:text-black overflow-hidden relative">

            {/* ALERTS */}
            <PostureAlert
                active={contextData?.alert === true}
                message={contextData?.alertMessage}
                onDismiss={() => setContextData(prev => ({ ...prev, alert: false }))}
            />

            {/* Background Gradients */}
            <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-chronex-accent/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

            {/* Floating Taskbar */}
            <AITaskbar />

            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="max-w-[1920px] mx-auto p-4 md:p-8 h-screen grid grid-cols-12 grid-rows-[auto_1fr] gap-4"
            >

                {/* HEADER */}
                <header className="col-span-12 flex items-center justify-between py-4 z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md hover:border-chronex-accent/50 transition-colors">
                            <Zap className="text-chronex-accent fill-chronex-accent" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tighter leading-none">CHRONEX</h1>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-chronex-accent rounded-full animate-pulse" />
                                <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">System v2.0</p>
                            </div>
                        </div>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                        <button
                            onClick={() => setView('dashboard')}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-chronex-accent text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <LayoutDashboard size={16} /> Dashboard
                        </button>
                        <button
                            onClick={() => setView('analyzer')}
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
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col text-right">
                            <span className="label-text">Session Time</span>
                            <span className="font-mono text-xl text-white">03:42:12</span>
                        </div>
                        <div className="w-px h-10 bg-white/10 hidden md:block" />
                        <div className="hidden md:flex flex-col text-right">
                            <span className="label-text">Status</span>
                            <span className="text-chronex-accent font-bold uppercase tracking-wider text-sm">Optimal</span>
                        </div>
                    </div>
                </header>

                {/* LEFT COLUMN - SENSORS & METRICS */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
                    {/* Vision Module */}
                    <div className={`flex-none ${view === 'analyzer' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <VisionMonitor onUpdate={setContextData} />
                    </div>

                    <div className="flex-none">
                        <MoodSelector onChange={(mood) => setContextData(prev => ({ ...prev, mood }))} />
                    </div>

                    <div className="glass-panel p-6 flex-1 flex flex-col justify-center items-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-chronex-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Activity className="text-chronex-accent mb-4 opacity-50" size={32} />
                        <span className="label-text mb-2">Cognitive Load</span>
                        <span className="text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                            {contextData?.focusScore || 0}<span className="text-2xl text-chronex-accent relative top-[-20px]">%</span>
                        </span>
                    </div>
                </div>

                {/* CENTER COLUMN - DYNAMIC CONTENT */}
                <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 h-full">
                    {view === 'dashboard' && (
                        <>
                            <div className="flex-1 relative">
                                <LiquidTimer />
                            </div>
                            <div className="h-1/3 min-h-[250px]">
                                <PerformanceChart newData={contextData} />
                            </div>
                        </>
                    )}

                    {view === 'analyzer' && (
                        <div className="h-full">
                            <PostureDetail />
                        </div>
                    )}

                    {view === 'report' && (
                        <div className="h-full">
                            <DailyReport />
                        </div>
                    )}

                    {view === 'game' && (
                        <div className="h-full">
                            <ReflexGame />
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN - INTELLIGENCE */}
                <div className="col-span-12 lg:col-span-3 h-full">
                    <AICoach contextData={contextData} />
                </div>

            </motion.main>
        </div>
    );
}

export default App;

