import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Keyboard, Mic2 } from 'lucide-react';

export function KeyboardClicker() {
    const [enabled, setEnabled] = useState(false);
    const audioContextRef = useRef(null);
    const [volume, setVolume] = useState(0.5);
    const [profile, setProfile] = useState('thock'); // thock, clack, typewriter

    useEffect(() => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        return () => audioContextRef.current?.close();
    }, []);

    const createOscillator = (ctx, type, freq, startTime, duration, vol) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(vol * volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
        return { osc, gain };
    };

    const playClick = () => {
        if (!enabled || !audioContextRef.current) return;
        if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
        const ctx = audioContextRef.current;
        const t = ctx.currentTime;

        if (profile === 'thock') {
            // Low, bassy, triangle wave
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(volume, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.15);

            // High freq click
            createOscillator(ctx, 'sine', 2500, t, 0.05, 0.3);

        } else if (profile === 'clack') {
            // Higher pitch, square wave punch
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.linearRampToValueAtTime(300, t + 0.05);
            osc.type = 'square';
            gain.gain.setValueAtTime(volume * 0.5, t); // Sharper attack
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.08);

            // Plastic hit
            createOscillator(ctx, 'sawtooth', 1500, t, 0.03, 0.2);

        } else if (profile === 'typewriter') {
            // Metallic ping + mechanical noise
            // Metallic
            createOscillator(ctx, 'sine', 800, t, 0.2, 0.8);

            // Noise burst (approximated with many random sines)
            for (let i = 0; i < 5; i++) {
                const freq = 1000 + Math.random() * 2000;
                createOscillator(ctx, 'square', freq, t, 0.05, 0.1);
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
            playClick();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, volume, profile]);

    return (
        <div className="glass-panel p-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${enabled ? 'bg-chronex-accent text-black shadow-[0_0_15px_#ccff00]' : 'bg-white/10 text-gray-400'}`}>
                    <Keyboard size={18} />
                </div>
                <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-white leading-none mb-1">Mech-Link</h3>
                    <select
                        value={profile}
                        onChange={(e) => setProfile(e.target.value)}
                        className="bg-transparent text-[10px] uppercase tracking-widest text-gray-400 border-none outline-none cursor-pointer hover:text-white"
                    >
                        <option value="thock">Thock (Deep)</option>
                        <option value="clack">Clack (Tactile)</option>
                        <option value="typewriter">Retro (Typewriter)</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                <button
                    onClick={() => setEnabled(!enabled)}
                    className={`hover:scale-110 transition-transform ${enabled ? 'text-chronex-accent' : 'text-gray-500'}`}
                >
                    {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                {enabled && (
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-12 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-chronex-accent"
                    />
                )}
            </div>
        </div>
    );
}
