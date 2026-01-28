import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

export function LiquidTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus');
    const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const progress = (timeLeft / totalTime) * 100;
    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="glass-panel p-6 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[300px]">
            <h3 className="text-chronex-text-muted text-sm font-mono tracking-widest absolute top-4 uppercase">
                Focus Engine
            </h3>

            <div className="relative w-48 h-48 rounded-full border-4 border-white/10 overflow-hidden bg-black/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                <motion.div
                    className="absolute inset-x-0 bottom-0 bg-chronex-accent/20"
                    animate={{ height: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />

                <div className="relative w-full h-full">
                    <motion.div
                        className="absolute inset-x-0 bottom-0 bg-chronex-accent"
                        initial={{ height: 0 }}
                        animate={{ height: `${progress}%` }}
                        transition={{ type: 'spring', bounce: 0, duration: 1 }}
                    />
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute bg-white/30 rounded-full"
                            style={{
                                width: Math.random() * 6 + 2,
                                height: Math.random() * 6 + 2,
                                left: `${Math.random() * 100}%`,
                                bottom: 0
                            }}
                            animate={{
                                bottom: '150%',
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: Math.random() * 2 + 2,
                                repeat: Infinity,
                                delay: Math.random() * 2
                            }}
                        />
                    ))}
                </div>

                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <span className="text-4xl font-bold font-mono tracking-tighter text-white mix-blend-difference">
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-8 z-10">
                <button
                    onClick={toggleTimer}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all active:scale-95"
                >
                    {isActive ? <Pause size={24} className="text-chronex-accent" /> : <Play size={24} className="text-chronex-accent" />}
                </button>
                <button
                    onClick={resetTimer}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all active:scale-95"
                >
                    <RotateCcw size={20} className="text-white/50" />
                </button>
            </div>

            <div className="absolute top-4 right-4 flex gap-1">
                {['focus', 'break'].map(m => (
                    <button
                        key={m}
                        onClick={() => { setMode(m); setTimeLeft(m === 'focus' ? 25 * 60 : 5 * 60); setIsActive(false); }}
                        className={`w-2 h-2 rounded-full ${mode === m ? 'bg-chronex-accent shadow-[0_0_10px_#ccff00]' : 'bg-white/20'}`}
                    />
                ))}
            </div>
        </div>
    );
}
