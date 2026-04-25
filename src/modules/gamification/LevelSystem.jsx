import React, { useState, useEffect } from 'react';
import { Trophy, Star, Crown, Zap } from 'lucide-react';

export function LevelSystem({ activityEvents }) {
    // Persistent State
    const [xp, setXp] = useState(() => parseInt(localStorage.getItem('chronex_xp') || '0'));
    const [level, setLevel] = useState(1);
    const [title, setTitle] = useState('Null Pointer');
    const [notification, setNotification] = useState(null);

    // Levels Config
    const LEVEL_THRESHOLDS = [
        { lvl: 1, xp: 0, title: 'Null Pointer' },
        { lvl: 2, xp: 100, title: 'Script Kiddie' },
        { lvl: 3, xp: 300, title: 'Code Monkey' },
        { lvl: 4, xp: 600, title: 'Junior Dev' },
        { lvl: 5, xp: 1000, title: 'Full Stack Hero' },
        { lvl: 6, xp: 2000, title: '10x Developer' },
        { lvl: 7, xp: 5000, title: 'Neural Architect' },
        { lvl: 8, xp: 10000, title: 'The Singularity' }
    ];

    // Calculate Level
    useEffect(() => {
        let currentLevel = 1;
        let currentTitle = 'Null Pointer';

        for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
            if (xp >= LEVEL_THRESHOLDS[i].xp) {
                currentLevel = LEVEL_THRESHOLDS[i].lvl;
                currentTitle = LEVEL_THRESHOLDS[i].title;
            }
        }

        if (currentLevel > level) {
            setNotification(`LEVEL UP! ${currentTitle}`);
            setTimeout(() => setNotification(null), 5000);
        }

        setLevel(currentLevel);
        setTitle(currentTitle);
        localStorage.setItem('chronex_xp', xp.toString());

    }, [xp, level]);

    // Listen to parent events (passed via props or context usually, here simulated via props for now)
    // We'll expose an "Add XP" function? Or simpler, just interval-based for posture?
    // Let's rely on an interval for "Time Alive" + external triggers if possible.
    // For now, simple passive gain.

    useEffect(() => {
        const interval = setInterval(() => {
            setXp(prev => prev + 1); // +1 XP every 10s just for existing
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    // Helper to calculate progress to next level
    const getProgress = () => {
        const currentThresh = LEVEL_THRESHOLDS.find(l => l.lvl === level);
        const nextThresh = LEVEL_THRESHOLDS.find(l => l.lvl === level + 1);

        if (!nextThresh) return 100; // Max level

        const range = nextThresh.xp - currentThresh.xp;
        const current = xp - currentThresh.xp;

        return Math.min(100, Math.max(0, (current / range) * 100));
    };

    return (
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-4 py-2 relative">

            {/* Notification Popover */}
            {notification && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 bg-chronex-accent text-black p-3 rounded-xl shadow-[0_0_30px_#ccff00] animate-in slide-in-from-top-4 text-center z-50">
                    <Crown size={24} className="mx-auto mb-1" />
                    <div className="font-bold text-xs uppercase">Level Up!</div>
                    <div className="font-bold text-lg leading-none">{title}</div>
                </div>
            )}

            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{title}</span>
                    <span className="text-sm font-bold text-white bg-chronex-accent/20 px-1.5 rounded text-chronex-accent">Lvl {level}</span>
                </div>
                {/* XP Bar */}
                <div className="w-24 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div
                        className="h-full bg-chronex-accent shadow-[0_0_10px_#ccff00] transition-all duration-1000"
                        style={{ width: `${getProgress()}%` }}
                    />
                </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-chronex-accent to-yellow-300 flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(204,255,0,0.5)]">
                <Trophy size={14} />
            </div>
        </div>
    );
}
