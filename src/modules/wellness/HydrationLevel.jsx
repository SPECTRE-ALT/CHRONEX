import React, { useState, useEffect } from 'react';
import { Droplet, Plus, Minus } from 'lucide-react';

export function HydrationLevel() {
    const [level, setLevel] = useState(100); // 0-100%
    const [intake, setIntake] = useState(0); // Liters
    const [alert, setAlert] = useState(false);

    // Natural dehydration simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setLevel(prev => {
                const drop = 0.5; // Drops 0.5% every tick
                const next = Math.max(0, prev - drop);
                if (next < 30) setAlert(true);
                return next;
            });
        }, 30000); // Every 30 seconds (accelerated for demo, real life would be slower)

        return () => clearInterval(interval);
    }, []);

    const addWater = () => {
        setLevel(prev => Math.min(100, prev + 20)); // +20% per drink
        setIntake(prev => prev + 0.25); // +250ml
        setAlert(false);
    };

    return (
        <div className="glass-panel p-4 flex items-center justify-between min-h-[100px] relative overflow-hidden">
            {/* Background Liquid Effect */}
            <div
                className={`absolute bottom-0 left-0 w-full bg-cyan-500/20 transition-all duration-1000 ease-in-out`}
                style={{ height: `${level}%` }}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_20px_#06b6d4]" />
            </div>

            <div className="relative z-10 flex items-center gap-4">
                <div className={`p-3 rounded-full border ${alert ? 'border-red-500 bg-red-500/10 animate-pulse' : 'border-cyan-500/30 bg-cyan-500/10'}`}>
                    <Droplet size={20} className={alert ? 'text-red-500' : 'text-cyan-400'} fill={level > 50 ? "currentColor" : "none"} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">Hydration</h3>
                    <div className="flex items-end gap-1">
                        <span className="text-2xl font-mono font-bold text-white">{Math.round(level)}%</span>
                        <span className="text-xs text-gray-500 mb-1">{intake.toFixed(2)}L</span>
                    </div>
                </div>
            </div>

            <button
                onClick={addWater}
                className="relative z-10 w-10 h-10 rounded-full bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-black flex items-center justify-center transition-all active:scale-95"
            >
                <Plus size={20} />
            </button>
        </div>
    );
}
