'use client';

import { create } from 'zustand';

export interface BoardTheme {
  id: string;
  name: string;
  light: string;
  dark: string;
  preview: string; // CSS gradient for menu preview
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'brown',  name: 'Brown',     light: '#f0d9b5', dark: '#b58863', preview: 'linear-gradient(135deg,#f0d9b5 50%,#b58863 50%)' },
  { id: 'green',  name: 'Tournament', light: '#ebecd0', dark: '#779556', preview: 'linear-gradient(135deg,#ebecd0 50%,#779556 50%)' },
  { id: 'blue',   name: 'Ocean',     light: '#dee3e6', dark: '#8ca2ad', preview: 'linear-gradient(135deg,#dee3e6 50%,#8ca2ad 50%)' },
  { id: 'wood',   name: 'Walnut',    light: '#e8c98c', dark: '#7c4a2a', preview: 'linear-gradient(135deg,#e8c98c 50%,#7c4a2a 50%)' },
  { id: 'purple', name: 'Twilight',  light: '#e7d8f0', dark: '#7a4eaf', preview: 'linear-gradient(135deg,#e7d8f0 50%,#7a4eaf 50%)' },
  { id: 'mono',   name: 'Mono',      light: '#e7e7e7', dark: '#404040', preview: 'linear-gradient(135deg,#e7e7e7 50%,#404040 50%)' },
];

export interface PieceSet {
  id: string;
  name: string;
  /**
   * Base URL: piece images live at `${base}/${color}${piece}.svg`,
   * where color is `w` or `b` and piece is `K|Q|R|B|N|P`.
   */
  base: string;
  attribution?: string;
}

export const PIECE_SETS: PieceSet[] = [
  { id: 'cburnett',   name: 'Cburnett (default)', base: 'https://images.chesscomfiles.com/chess-themes/pieces/neo' /* fallback override below */ },
  { id: 'alpha',      name: 'Alpha',              base: 'https://lichess1.org/assets/piece/alpha' },
  { id: 'fantasy',    name: 'Fantasy',            base: 'https://lichess1.org/assets/piece/fantasy' },
  { id: 'leipzig',    name: 'Leipzig',            base: 'https://lichess1.org/assets/piece/leipzig' },
  { id: 'merida',     name: 'Merida',             base: 'https://lichess1.org/assets/piece/merida' },
  { id: 'staunty',    name: 'Staunty',            base: 'https://lichess1.org/assets/piece/staunty' },
];

// Cburnett (the default Lichess set) — keep its real CDN path so the SVGs actually render.
PIECE_SETS[0].base = 'https://lichess1.org/assets/piece/cburnett';

interface SettingsState {
  theme: string;          // BoardTheme.id
  pieceSet: string;       // PieceSet.id
  soundEnabled: boolean;
  showCoords: boolean;
  setTheme: (id: string) => void;
  setPieceSet: (id: string) => void;
  setSoundEnabled: (b: boolean) => void;
  setShowCoords: (b: boolean) => void;
  hydrate: () => void;
}

const KEY = 'chess.settings.v1';

interface Persisted {
  theme: string;
  pieceSet: string;
  soundEnabled: boolean;
  showCoords: boolean;
}

function persist(s: Persisted) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export const useSettings = create<SettingsState>((set, get) => ({
  theme: 'green',
  pieceSet: 'cburnett',
  soundEnabled: true,
  showCoords: true,
  setTheme: (id) => { set({ theme: id }); persist({ ...get(), theme: id }); },
  setPieceSet: (id) => { set({ pieceSet: id }); persist({ ...get(), pieceSet: id }); },
  setSoundEnabled: (b) => { set({ soundEnabled: b }); persist({ ...get(), soundEnabled: b }); },
  setShowCoords: (b) => { set({ showCoords: b }); persist({ ...get(), showCoords: b }); },
  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      set({
        theme: parsed.theme ?? 'green',
        pieceSet: parsed.pieceSet ?? 'cburnett',
        soundEnabled: parsed.soundEnabled ?? true,
        showCoords: parsed.showCoords ?? true,
      });
    } catch { /* ignore */ }
  },
}));

export function getBoardTheme(id: string): BoardTheme {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0];
}

export function getPieceSet(id: string): PieceSet {
  return PIECE_SETS.find((p) => p.id === id) ?? PIECE_SETS[0];
}
