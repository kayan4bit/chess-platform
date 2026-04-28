'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useSession } from '@/lib/store';
import { api } from '@/lib/api';
import { SettingsDrawer } from './SettingsDrawer';

export function Nav() {
  const { user, token, setSession, hydrate, clear } = useSession();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!token) {
      api.guest().then((r) => setSession(r.token, r.user)).catch(() => undefined);
    }
  }, [token, setSession]);

  return (
    <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
        <Link href="/" className="font-bold text-lg text-white flex items-center gap-2">
          <span aria-hidden>♞</span>
          <span>Chess</span>
        </Link>
        <nav className="flex gap-4 text-sm text-neutral-300">
          <Link href="/play" className="hover:text-white transition">Play</Link>
          <Link href="/play/ai" className="hover:text-white transition">vs Bots</Link>
          <Link href="/analysis" className="hover:text-white transition">Analysis</Link>
          <Link href="/leaderboard" className="hover:text-white transition">Leaderboard</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-neutral-400">
                <span className="text-white">{user.username}</span>{' '}
                <span className="text-neutral-500">({user.rating})</span>
                {user.isGuest && <span className="ml-1 text-[10px] uppercase tracking-wide bg-neutral-800 text-neutral-400 rounded px-1.5 py-0.5">guest</span>}
              </span>
              {user.isGuest ? (
                <Link href="/login" className="btn-outline text-xs">Save account</Link>
              ) : (
                <button
                  className="btn-outline text-xs"
                  onClick={() => { clear(); location.reload(); }}
                >Sign out</button>
              )}
            </>
          ) : (
            <span className="text-neutral-500">Connecting…</span>
          )}
          <SettingsDrawer />
        </div>
      </div>
    </header>
  );
}
