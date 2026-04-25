import React, { useState, useEffect } from 'react';
import { Wind } from 'lucide-react';

export function BreathingOrb() {
    const [phase, setPhase] = useState('Inhale'); // Inhale, Hold, Exhale
    const [active, setActive] = useState(false);

    useEffect(() => {
        if (!active) {
            setPhase('Ready');
            return;
        }

        const cycle = async () => {
            while (active) {
                setPhase('Inhale');
                await new Promise(r => setTimeout(r, 4000));

                if (!active) break;
                setPhase('Hold');
                await new Promise(r => setTimeout(r, 7000));

                if (!active) break;
                setPhase('Exhale');
                await new Promise(r => setTimeout(r, 8000));
            }
        };

        cycle();
        return () => setActive(false); // Cleanup safety
    }, [active]);

    return (
        <div className="glass-panel p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[200px] gap-4">
            <div className="absolute top-4 left-4 flex items-center gap-2 text-white/50">
                <Wind size={16} />
                <span className="text-xs uppercase tracking-widest font-mono">Resonance 4-7-8</span>
            </div>

            <div className="relative cursor-pointer" onClick={() => setActive(!active)}>
                {/* The Orb */}
                <div
                    className={`w-24 h-24 rounded-full bg-gradient-to-br from-chronex-accent to-white transition-all duration-[4000ms] ease-in-out relative z-10 opacity-80 blur-sm
                    ${phase === 'Inhale' ? 'scale-150 duration-[4000ms]' :
                            phase === 'Exhale' ? 'scale-50 duration-[8000ms]' :
                                phase === 'Hold' ? 'scale-150 duration-[0ms]' : ''}
                    ${!active ? 'scale-100 opacity-20 grayscale' : ''}
                    `}
                />

                {/* Outer Glow Ring */}
                <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-chronex-accent/30 transition-all duration-[4000ms]
                     ${phase === 'Inhale' ? 'w-48 h-48 opacity-100' : 'w-24 h-24 opacity-0'}
                     ${!active && 'hidden'}
                     `}
                />

                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <span className={`text-sm font-bold font-mono uppercase tracking-widest ${active ? 'text-black mix-blend-screen' : 'text-white/50'}`}>
                        {active ? phase : "Start"}
                    </span>
                </div>
            </div>

            {active && (
                <p className="text-xs text-center text-white/50 absolute bottom-4 animate-pulse">
                    Sync your breathing with the orb
                </p>
            )}
        </div>
    );
}
