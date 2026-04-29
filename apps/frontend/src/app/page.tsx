'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { BOTS } from '@/lib/bots';
import type { ServerEvent } from '@chess/shared';

const QUICK_MODES = [
  { key: 'bullet', label: '1+0', sub: 'Bullet', initial: 60, increment: 0 },
  { key: 'blitz', label: '3+2', sub: 'Blitz', initial: 180, increment: 2 },
  { key: 'rapid', label: '10+5', sub: 'Rapid', initial: 600, increment: 5 },
  { key: 'classical', label: '30+30', sub: 'Classical', initial: 1800, increment: 30 },
];

export default function Home() {
  const { token, user, hydrate } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<string>('');
  const [queuedMode, setQueuedMode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  const quickPlay = useCallback((mode: string) => {
    if (!token) return;
    const sock = getSocket(token);
    setQueuedMode(mode);
    setStatus(`Searching opponent for ${mode}…`);
    const onServer = (evt: ServerEvent) => {
      if (evt.type === 'queued') {
        setStatus(`Queued — if nobody joins within 15s, Stockfish jumps in.`);
      } else if (evt.type === 'match_found') {
        sock.off('server', onServer);
        router.push(`/game/${evt.game.id}`);
      } else if (evt.type === 'error') {
        setStatus(evt.message);
      }
    };
    sock.on('server', onServer);
    sock.emit('queue', { mode });
  }, [token, router]);

  const cancel = useCallback(() => {
    if (!token) return;
    const sock = getSocket(token);
    sock.emit('queue_cancel');
    setQueuedMode(null);
    setStatus('');
  }, [token]);

  const playRandomBot = useCallback(async () => {
    if (!token || busy) return;
    setBusy(true);
    try {
      const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
      const game = await api.createAiGame(token, { level: bot.level, color: 'random', initial: 600, increment: 5 });
      router.push(`/game/${game.id}`);
    } catch (err) {
      setStatus((err as Error).message);
      setBusy(false);
    }
  }, [token, busy, router]);

  return (
    <section className="grid lg:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            UCX Chess — <span className="text-brand">play instantly.</span>
          </h1>
          <p className="text-neutral-300 text-base max-w-xl">
            Free, ad-free, privacy-first chess. No signup required: a guest account is already waiting for you.
            Six board themes, six piece sets, six bot personalities, and an auto-fallback so you never wait around.
          </p>
        </header>

        <div className="card overflow-hidden p-0">
          <div
            className="aspect-[16/10] w-full"
            style={{
              backgroundImage: 'repeating-conic-gradient(#779556 0% 25%, #ebecd0 0% 50%)',
              backgroundSize: '12.5% 12.5%',
              backgroundPosition: '0 0',
            }}
          >
            <div className="grid place-items-center h-full text-[7rem] drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">♞</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <Feature title="Real-time multiplayer" body="WebSocket gameplay with clocks, premoves, draw offers, resign, and reconnection." />
          <Feature title="Bots that don't make you wait" body="Queue alone? After 15s we pair you with Stockfish at your level — no infinite searching." />
          <Feature title="Post-game analysis" body="Open any finished game and get blunder/mistake/inaccuracy classification with engine lines." />
          <Feature title="6 themes · 6 piece sets" body="Brown · Tournament · Ocean · Walnut · Twilight · Mono — paired with Cburnett, Alpha, Fantasy, Leipzig, Merida, Staunty." />
          <Feature title="Privacy-first" body="No ads, no analytics, no third-party trackers. All data lives in one SQLite file. Passwords are bcrypt-hashed." />
          <Feature title="Free + open" body="AGPL-3.0. Deploy your own with one click to Render or Fly. Frontend deploys free to Cloudflare Pages." />
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 self-start">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Quick play</h2>
            {user ? (
              <span className="text-xs text-neutral-500">{user.username} · {user.rating}</span>
            ) : (
              <span className="text-xs text-neutral-500">connecting…</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_MODES.map((m) => (
              <button
                key={m.key}
                disabled={!token || queuedMode !== null}
                onClick={() => quickPlay(m.key)}
                className={`card-soft text-left p-3 transition hover:border-brand disabled:opacity-50 ${queuedMode === m.key ? 'border-brand ring-1 ring-brand/40' : ''}`}
              >
                <div className="text-base font-bold text-white">{m.label}</div>
                <div className="text-[11px] uppercase tracking-wide text-neutral-500">{m.sub}</div>
              </button>
            ))}
          </div>
          {queuedMode ? (
            <div className="text-xs text-neutral-400 flex items-center justify-between">
              <span>{status}</span>
              <button onClick={cancel} className="btn-outline text-xs">Cancel</button>
            </div>
          ) : status ? (
            <div className="text-xs text-red-400">{status}</div>
          ) : null}
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Play vs Bot</h2>
          <button onClick={playRandomBot} disabled={!token || busy} className="btn w-full">
            {busy ? 'Starting…' : 'Random bot · 10+5'}
          </button>
          <Link href="/play/ai" className="btn-outline w-full text-center block">Pick a personality →</Link>
        </div>

        <div className="card space-y-2 text-sm text-neutral-300">
          <h2 className="font-semibold text-white">More</h2>
          <Link href="/analysis" className="block hover:text-white">→ Analyze a PGN</Link>
          <Link href="/leaderboard" className="block hover:text-white">→ Leaderboard</Link>
          <Link href="/login" className="block hover:text-white">→ Sign in / save guest</Link>
          <Link href="/about" className="block hover:text-white">→ About UCX Chess</Link>
        </div>
      </aside>
    </section>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-white text-sm">{title}</h3>
      <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{body}</p>
    </div>
  );
}
