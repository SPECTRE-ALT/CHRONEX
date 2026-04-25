import { useCallback, useRef, useEffect } from 'react';

const beep = new Audio("/beep.mp3");

export function useAudioAlert() {
    const audioContext = useRef(null);
    const continuousBeepRef = useRef(null);

    // Auto-resume audio context on user interaction
    // AND Start a silent 'Ghost' oscillator to keep the tab active in background (Chrome Throttling Workaround)
    useEffect(() => {
        const resumeAudio = () => {
            if (audioContext.current) {
                if (audioContext.current.state === 'suspended') {
                    audioContext.current.resume().catch(e => console.error("Audio resume failed during interaction", e));
                }

                // Start Silent Beacon if not already running
                // A silent loop keeps the audio thread high priority
                if (!window._audioBeacon) {
                    try {
                        const ctx = audioContext.current;
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.frequency.value = 0.001; // Inaudible
                        gain.gain.value = 0.001; // Silent
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start();
                        window._audioBeacon = osc;
                        console.log("Audio Beacon Started (Background Persistence)");
                    } catch (e) {
                        console.error("Beacon fail", e);
                    }
                }
            }
        };

        window.addEventListener('click', resumeAudio);
        window.addEventListener('keydown', resumeAudio);

        return () => {
            window.removeEventListener('click', resumeAudio);
            window.removeEventListener('keydown', resumeAudio);
        };
    }, []);

    const playAlert = useCallback(() => {
        try {
            beep.currentTime = 0;
            beep.play().catch(e => console.error("Audio play failed", e));
        } catch (e) {
            console.error(e);
        }
    }, []);

    const playSuccess = useCallback(() => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        const ctx = audioContext.current;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Positive "Lock" Sound - Ascending Sine
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    }, []);

    const playError = useCallback(() => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        const ctx = audioContext.current;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Error "Buzz"
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }, []);

    const playWarning = useCallback(() => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = audioContext.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Warning "Beep"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    }, []);

    const playNotification = useCallback(() => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = audioContext.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // Pleasant "Chime"
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.2);
        
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.4);
    }, []);

    const startContinuousBeep = useCallback(() => {
        if (continuousBeepRef.current) return;
        playAlert(); // play immediately
        continuousBeepRef.current = setInterval(() => {
            playAlert();
        }, 1000);
    }, [playAlert]);

    const stopContinuousBeep = useCallback(() => {
        if (continuousBeepRef.current) {
            clearInterval(continuousBeepRef.current);
            continuousBeepRef.current = null;
        }
    }, []);

    return { playAlert, playSuccess, playError, playWarning, playNotification, startContinuousBeep, stopContinuousBeep };
}
