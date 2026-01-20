/**
 * useSounds Hook - Synthesized Audio Feedback System
 * Uses Web Audio API to create satisfying interaction sounds
 */

import { useCallback, useRef, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

// Audio Context singleton
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

export const useSounds = () => {
    const { settings } = useSettings();
    const isEnabled = settings.enableSound ?? true;
    const lastPlayTime = useRef<number>(0);

    // Resume audio context on user interaction (required by browsers)
    useEffect(() => {
        const resumeAudio = () => {
            if (audioContext?.state === 'suspended') {
                audioContext.resume();
            }
        };
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
        return () => {
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
        };
    }, []);

    // Debounce rapid sounds
    const canPlay = useCallback(() => {
        const now = Date.now();
        if (now - lastPlayTime.current < 50) return false;
        lastPlayTime.current = now;
        return true;
    }, []);

    /**
     * Glass-like click sound for tile interactions
     */
    const playClick = useCallback(() => {
        if (!isEnabled || !canPlay()) return;

        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
            osc.type = 'sine';

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    }, [isEnabled, canPlay]);

    /**
     * Success chime for completing a tile
     */
    const playSuccess = useCallback(() => {
        if (!isEnabled || !canPlay()) return;

        try {
            const ctx = getAudioContext();
            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)

            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                osc.type = 'sine';

                const startTime = ctx.currentTime + i * 0.08;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

                osc.start(startTime);
                osc.stop(startTime + 0.3);
            });
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    }, [isEnabled, canPlay]);

    /**
     * Celebratory fanfare for BINGO win
     */
    const playBingo = useCallback(() => {
        if (!isEnabled) return;

        try {
            const ctx = getAudioContext();
            // Triumphant ascending arpeggio
            const notes = [
                { freq: 523.25, time: 0 },      // C5
                { freq: 659.25, time: 0.1 },    // E5
                { freq: 783.99, time: 0.2 },    // G5
                { freq: 1046.50, time: 0.35 },  // C6
                { freq: 1318.51, time: 0.5 },   // E6
            ];

            notes.forEach(({ freq, time }) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
                osc.type = 'sine';

                gain.gain.setValueAtTime(0, ctx.currentTime + time);
                gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + time + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.5);

                osc.start(ctx.currentTime + time);
                osc.stop(ctx.currentTime + time + 0.5);
            });

            // Add a subtle "shimmer" effect
            const shimmer = ctx.createOscillator();
            const shimmerGain = ctx.createGain();
            shimmer.connect(shimmerGain);
            shimmerGain.connect(ctx.destination);

            shimmer.type = 'sine';
            shimmer.frequency.setValueAtTime(2000, ctx.currentTime + 0.6);
            shimmer.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 1.2);

            shimmerGain.gain.setValueAtTime(0, ctx.currentTime + 0.6);
            shimmerGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.7);
            shimmerGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

            shimmer.start(ctx.currentTime + 0.6);
            shimmer.stop(ctx.currentTime + 1.2);
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    }, [isEnabled]);

    /**
     * Soft whoosh for UI transitions
     */
    const playWhoosh = useCallback(() => {
        if (!isEnabled || !canPlay()) return;

        try {
            const ctx = getAudioContext();

            // White noise burst filtered
            const bufferSize = ctx.sampleRate * 0.15;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }

            const noise = ctx.createBufferSource();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            noise.buffer = buffer;
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.15);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

            noise.start(ctx.currentTime);
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    }, [isEnabled, canPlay]);

    /**
     * Soft error/deny sound
     */
    const playError = useCallback(() => {
        if (!isEnabled || !canPlay()) return;

        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
            osc.type = 'sine';

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    }, [isEnabled, canPlay]);

    return {
        playClick,
        playSuccess,
        playBingo,
        playWhoosh,
        playError,
    };
};
