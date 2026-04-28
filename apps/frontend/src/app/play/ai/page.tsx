'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/store';
import { api } from '@/lib/api';
import { BOTS, type BotPersonality } from '@/lib/bots';
import { sfx } from '@/lib/sounds';
import { useSettings } from '@/lib/settings';

const TIME_PRESETS = [
  { label: 'Bullet 1+0', initial: 60, increment: 0 },
  { label: 'Blitz 3+2', initial: 180, increment: 2 },
  { label: 'Rapid 10+5', initial: 600, increment: 5 },
  { label: 'Classical 30+30', initial: 1800, increment: 30 },
];

const COLORS: Array<'white' | 'black' | 'random'> = ['white', 'black', 'random'];

export default function PlayAiLobby() {
  const { token } = useSession();
  const { soundEnabled } = useSettings();
  const router = useRouter();
  const [bot, setBot] = useState<BotPersonality>(BOTS[1]);
  const [color, setColor] = useState<'white' | 'black' | 'random'>('random');
  const [preset, setPreset] = useState(TIME_PRESETS[2]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      if (soundEnabled) sfx.click();
      const game = await api.createAiGame(token, {
        level: bot.level,
        color,
        initial: preset.initial,
        increment: preset.increment,
      });
      router.push(`/game/${game.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Play vs Bots</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Pick an opponent. Each personality is the same Stockfish engine pinned to a different skill — different feel,
          different mistakes.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BOTS.map((b) => (
          <button
            key={b.id}
            onClick={() => { setBot(b); if (soundEnabled) sfx.click(); }}
            className={`card text-left transition hover:border-brand ${bot.id === b.id ? 'border-brand ring-1 ring-brand/40' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">{b.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-white">{b.name}</div>
                <div className="text-xs text-neutral-400">≈ {b.approxElo} Elo · skill {b.level}</div>
              </div>
              <span className="text-[10px] uppercase tracking-wide bg-neutral-800 text-neutral-400 rounded px-2 py-0.5">
                {b.badge}
              </span>
            </div>
            <p className="text-sm text-neutral-300 mt-2">{b.blurb}</p>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="card space-y-3">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Time control</div>
          <div className="grid grid-cols-2 gap-2">
            {TIME_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setPreset(p)}
                className={`btn-outline text-sm ${preset.label === p.label ? 'border-brand text-white' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card space-y-3">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Your color</div>
          <div className="grid grid-cols-3 gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`btn-outline text-sm capitalize ${color === c ? 'border-brand text-white' : ''}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <button disabled={!token || loading} onClick={start} className="btn w-full md:w-auto md:px-10">
          {loading ? 'Starting…' : `Play ${bot.name}`}
        </button>
        {error && <div className="text-sm text-red-400 mt-2">{error}</div>}
      </div>
    </section>
  );
}
