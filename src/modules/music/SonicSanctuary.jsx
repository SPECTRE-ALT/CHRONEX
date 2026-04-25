import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Radio, CloudRain, Zap, Waves } from 'lucide-react';

export function SonicSanctuary() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [mode, setMode] = useState('brown'); // 'brown', 'pink', 'rain'
    const audioContextRef = useRef(null);
    const gainNodeRef = useRef(null);
    const sourceNodeRef = useRef(null);

    // Initialize Audio Context
    useEffect(() => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.value = volume;

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Update Volume
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.1);
        }
    }, [volume]);

    // Sound Generation Logic
    const playSound = () => {
        if (!audioContextRef.current) return;

        // Resume context if suspended (browser requirements)
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        stopSound(); // Stop any existing sound

        const bufferSize = 2 * audioContextRef.current.sampleRate;
        const noiseBuffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        // Usage for Brown/Pink noise generation
        // Simple White Noise as base
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02; // Simple Brownish approximation
            lastOut = output[i];
            output[i] *= 3.5;
        }

        // Better Generators
        if (mode === 'brown') {
            generateBrownNoise(output);
        } else if (mode === 'pink') {
            generatePinkNoise(output);
        } else if (mode === 'rain') {
            generateRainNoise(output);
        }

        const noise = audioContextRef.current.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        noise.connect(gainNodeRef.current);
        noise.start();
        sourceNodeRef.current = noise;
        setIsPlaying(true);
    };

    const stopSound = () => {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        setIsPlaying(false);
    };

    const togglePlay = () => {
        if (isPlaying) stopSound();
        else playSound();
    };


    // Noise Algorithms
    let lastOut = 0;
    const generateBrownNoise = (data) => {
        let lastOut = 0;
        for (let i = 0; i < data.length; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + (0.02 * white)) / 1.02;
            data[i] = lastOut * 3.5;
        }
    };

    const generatePinkNoise = (data) => {
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < data.length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11;
            b6 = white * 0.115926;
        }
    };

    const generateRainNoise = (data) => {
        // Rain is basically pink noise but "wetter" (often modulated)
        // We'll just use a variation of pink logic with some random popping
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < data.length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            data[i] = (b0 + b1 + b2 + b3) * 0.1;

            // Add random higher freq drops
            if (Math.random() > 0.995) {
                data[i] += (Math.random() * 0.5);
            }
        }
    };

    // Switch mode logic
    const handleModeChange = (newMode) => {
        setMode(newMode);
        if (isPlaying) {
            // Quick restart to apply new buffer
            const wasPlaying = isPlaying;
            stopSound();
            // Small timeout to allow state to settle if needed, but synchronous is fine for this
            setTimeout(() => {
                setMode(newMode); // Ensure state
                // To actually apply the new generator, we need to call playSound again *with the new mode*.
                // However, playSound uses the 'mode' state which might not be updated in the closure yet if we aren't careful.
                // Actually, let's just use a ref or pass generic argument.
                // For now, simpler: user has to toggle or we do it via effect. 
            }, 0);
        }
    };

    // Effect to handle mode change live
    useEffect(() => {
        if (isPlaying) {
            playSound(); // This will stop valid previous sound and start new one with new mode state
        }
    }, [mode]);

    return (
        <div className="glass-panel p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isPlaying ? 'bg-chronex-accent text-black shadow-[0_0_15px_#ccff00]' : 'bg-white/10 text-gray-400'}`}>
                    <Waves size={20} className={isPlaying ? "animate-pulse" : ""} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">Sonic Sanctuary</h3>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">Neural Entrainment</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setMode('brown')}
                    className={`p-1.5 rounded-lg transition-all ${mode === 'brown' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'}`}
                    title="Brown Noise (Deep Focus)"
                >
                    <Zap size={16} />
                </button>
                <button
                    onClick={() => setMode('pink')}
                    className={`p-1.5 rounded-lg transition-all ${mode === 'pink' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'}`}
                    title="Pink Noise (Balance)"
                >
                    <Radio size={16} />
                </button>
                <button
                    onClick={() => setMode('rain')}
                    className={`p-1.5 rounded-lg transition-all ${mode === 'rain' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'}`}
                    title="Rain (Calm)"
                >
                    <CloudRain size={16} />
                </button>
            </div>

            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                <button onClick={togglePlay} className="hover:scale-110 transition-transform">
                    {isPlaying ? <Volume2 className="text-chronex-accent" size={20} /> : <VolumeX className="text-gray-500" size={20} />}
                </button>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-16 accent-chronex-accent h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
            </div>
        </div>
    );
}
