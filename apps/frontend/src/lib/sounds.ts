'use client';

/**
 * Tiny WebAudio-driven sound effects. Avoids shipping audio files —
 * each cue is synthesized in the browser. Safe to call from anywhere;
 * it lazy-creates an AudioContext on first user interaction.
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  try {
    type AudioCtor = typeof AudioContext;
    interface WebkitWindow extends Window { webkitAudioContext?: AudioCtor }
    const w = window as WebkitWindow;
    const C = window.AudioContext ?? w.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneOpts {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  release?: number;
}

function tone({ freq, duration, type = 'sine', gain = 0.18, attack = 0.005, release = 0.08 }: ToneOpts) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + attack);
  g.gain.setValueAtTime(gain, now + duration - release);
  g.gain.linearRampToValueAtTime(0, now + duration);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export const sfx = {
  move:    () => tone({ freq: 520, duration: 0.06, type: 'triangle', gain: 0.14 }),
  capture: () => { tone({ freq: 320, duration: 0.06, type: 'square', gain: 0.18 }); setTimeout(() => tone({ freq: 180, duration: 0.08, type: 'square', gain: 0.13 }), 30); },
  check:   () => { tone({ freq: 880, duration: 0.07, type: 'sawtooth', gain: 0.18 }); setTimeout(() => tone({ freq: 1175, duration: 0.09, type: 'sawtooth', gain: 0.15 }), 60); },
  end:     () => { tone({ freq: 660, duration: 0.12, type: 'sine', gain: 0.18 }); setTimeout(() => tone({ freq: 440, duration: 0.18, type: 'sine', gain: 0.16 }), 120); setTimeout(() => tone({ freq: 880, duration: 0.22, type: 'sine', gain: 0.18 }), 240); },
  click:   () => tone({ freq: 880, duration: 0.04, type: 'triangle', gain: 0.10 }),
};

export type SfxKey = keyof typeof sfx;
