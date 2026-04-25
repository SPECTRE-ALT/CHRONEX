import React, { useState, useEffect } from 'react';
import { Eye, X } from 'lucide-react';

export function EyeGym({ onClose }) {
    const [pos, setPos] = useState({ x: '50%', y: '50%' });
    const [step, setStep] = useState(0);
    const [active, setActive] = useState(false);

    // Sequence of positions
    const sequence = [
        { x: '10%', y: '10%', text: 'Top Left' },
        { x: '90%', y: '10%', text: 'Top Right' },
        { x: '90%', y: '90%', text: 'Bottom Right' },
        { x: '10%', y: '90%', text: 'Bottom Left' },
        { x: '50%', y: '10%', text: 'Up' },
        { x: '50%', y: '90%', text: 'Down' },
        { x: '10%', y: '50%', text: 'Left' },
        { x: '90%', y: '50%', text: 'Right' },
        { x: '50%', y: '50%', text: 'Center Focus' }
    ];

    useEffect(() => {
        if (active) {
            let s = 0;
            const interval = setInterval(() => {
                setStep(s);
                setPos({ x: sequence[s].x, y: sequence[s].y });
                s++;
                if (s >= sequence.length) {
                    clearInterval(interval);
                    setTimeout(() => setActive(false), 2000); // End
                }
            }, 3000); // 3 seconds per spot

            return () => clearInterval(interval);
        }
    }, [active]);

    if (!active) {
        return (
            <div className="glass-panel p-4 flex flex-col items-center justify-center text-center gap-2 h-full">
                <div className="p-3 bg-white/5 rounded-full mb-2">
                    <Eye className="text-chronex-accent" size={24} />
                </div>
                <h3 className="font-bold text-white">20-20-20 Gym</h3>
                <p className="text-xs text-gray-400 mb-2">Relieve eye strain with guided movements.</p>
                <button
                    onClick={() => setActive(true)}
                    className="px-6 py-2 bg-chronex-accent text-black font-bold rounded hover:shadow-[0_0_15px_#ccff00] transition-all"
                >
                    Start Session
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
            {/* Close Button */}
            <button
                onClick={() => setActive(false)}
                className="absolute top-8 right-8 text-white/50 hover:text-white"
            >
                <X size={32} />
            </button>

            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute w-8 h-8 bg-chronex-accent rounded-full shadow-[0_0_30px_#ccff00] transition-all duration-1000 ease-in-out flex items-center justify-center"
                    style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
                >
                    <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                </div>
            </div>

            <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-4 tracking-tighter">Follow the Light</h2>
                <p className="text-xl text-chronex-accent font-mono animate-pulse">{sequence[step]?.text}</p>
                <p className="text-sm text-gray-500 mt-8">Keep your head still. Move only your eyes.</p>
            </div>
        </div>
    );
}
