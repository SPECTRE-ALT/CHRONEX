import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Target } from 'lucide-react';

export function ReflexGame() {
    const [playing, setPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [target, setTarget] = useState({ x: 50, y: 50 });
    const containerRef = useRef(null);

    const moveTarget = () => {
        if (containerRef.current) {
            const maxX = containerRef.current.clientWidth - 64;
            const maxY = containerRef.current.clientHeight - 64;
            const x = Math.random() * maxX;
            const y = Math.random() * maxY;
            setTarget({ x, y });
        }
    };

    const handleClick = () => {
        if (!playing) return;
        setScore(s => s + 10);
        moveTarget();
        // Play sound effect sound be here
    };

    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setPlaying(true);
        moveTarget();
    };

    useEffect(() => {
        if (playing && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0) {
            setPlaying(false);
            if (score > highScore) setHighScore(score);
        }
    }, [playing, timeLeft, score, highScore]);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            if (playing) moveTarget();
        });
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [playing]);

    return (
        <div className="glass-panel h-full flex flex-col relative overflow-hidden p-6">
            <div className="flex justify-between items-center mb-4 z-10">
                <div className="flex items-center gap-2">
                    <Target className="text-chronex-accent" size={20} />
                    <h3 className="font-mono text-sm uppercase tracking-widest text-white">Neural Reflex</h3>
                </div>
                <div className="font-mono text-xl text-chronex-accent">{score.toString().padStart(4, '0')}</div>
            </div>

            <div
                ref={containerRef}
                className="flex-1 relative bg-white/5 rounded-2xl border border-white/10 overflow-hidden cursor-crosshair"
            >
                {!playing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                        <div className="text-4xl font-bold text-white mb-2 tracking-tighter">
                            {timeLeft === 0 ? "SESSION COMPLETE" : "READY?"}
                        </div>
                        <p className="text-chronex-text-muted font-mono text-xs mb-6 uppercase tracking-widest">
                            High Score: {highScore}
                        </p>
                        <button
                            onClick={startGame}
                            className="btn-primary"
                        >
                            {timeLeft === 0 ? <RotateCcw size={16} /> : <Play size={16} />}
                            {timeLeft === 0 ? "Re-Initialize" : "Start Sequence"}
                        </button>
                    </div>
                ) : (
                    <div className="absolute top-4 right-4 font-mono text-2xl font-bold text-white/20">
                        00:{timeLeft.toString().padStart(2, '0')}
                    </div>
                )}

                {playing && (
                    <button
                        onClick={handleClick}
                        style={{ left: target.x, top: target.y }}
                        className="absolute w-16 h-16 rounded-full bg-chronex-accent shadow-[0_0_30px_#ccff00] border-4 border-white active:scale-95 transition-transform duration-75 flex items-center justify-center group"
                    >
                        <div className="w-2 h-2 bg-black rounded-full group-hover:scale-150 transition-transform" />
                    </button>
                )}
            </div>

            <div className="mt-4 flex justify-between items-center text-xs text-chronex-text-muted font-mono">
                <span>STATUS: {playing ? "ACTIVE" : "STANDBY"}</span>
                <span>LATENCY: 12ms</span>
            </div>
        </div>
    );
}
