'use client';

import { useEffect, useState } from 'react';
import { BOARD_THEMES, PIECE_SETS, useSettings } from '@/lib/settings';
import { sfx } from '@/lib/sounds';

export function SettingsDrawer() {
  const {
    theme, pieceSet, soundEnabled, showCoords,
    setTheme, setPieceSet, setSoundEnabled, setShowCoords, hydrate,
  } = useSettings();
  const [open, setOpen] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Settings"
        aria-label="Settings"
        className="text-neutral-400 hover:text-white transition text-lg leading-none"
      >
        ⚙
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-neutral-950 border-l border-neutral-800 p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Settings</h2>
              <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-white text-xl leading-none">×</button>
            </div>

            <section className="mb-6">
              <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Board theme</div>
              <div className="grid grid-cols-3 gap-2">
                {BOARD_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); if (soundEnabled) sfx.click(); }}
                    className={`rounded border p-2 text-left ${theme === t.id ? 'border-brand' : 'border-neutral-800 hover:border-neutral-700'}`}
                  >
                    <div className="aspect-square w-full rounded mb-1.5" style={{ background: t.preview }} />
                    <div className="text-xs text-neutral-300">{t.name}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="mb-6">
              <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Piece set</div>
              <div className="grid grid-cols-3 gap-2">
                {PIECE_SETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setPieceSet(p.id); if (soundEnabled) sfx.click(); }}
                    className={`rounded border p-2 text-left ${pieceSet === p.id ? 'border-brand' : 'border-neutral-800 hover:border-neutral-700'}`}
                  >
                    <div className="aspect-square w-full rounded mb-1.5 bg-neutral-900 grid place-items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${p.base}/wN.svg`} alt={`${p.name} knight`} className="w-9 h-9" />
                    </div>
                    <div className="text-xs text-neutral-300">{p.name}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <label className="flex items-center justify-between text-sm">
                <span className="text-neutral-300">Move sounds</span>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => { setSoundEnabled(e.target.checked); if (e.target.checked) sfx.click(); }}
                  className="accent-emerald-500"
                />
              </label>
              <label className="flex items-center justify-between text-sm">
                <span className="text-neutral-300">Show board coordinates</span>
                <input
                  type="checkbox"
                  checked={showCoords}
                  onChange={(e) => setShowCoords(e.target.checked)}
                  className="accent-emerald-500"
                />
              </label>
            </section>

            <div className="text-xs text-neutral-600 mt-8">
              Settings are stored in your browser only. Nothing is sent to the server.
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
