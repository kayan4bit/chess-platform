/**
 * Curated Stockfish "personalities" — same engine, different skill caps and
 * vibes. The level maps directly to UCI Skill Level (0–20); Stockfish's
 * UCI_Elo is roughly 800 + level*100.
 */
export interface BotPersonality {
  id: string;
  name: string;
  emoji: string;
  level: number;          // Stockfish skill 0–20
  approxElo: number;      // for display
  blurb: string;
  badge: string;          // small chip ("aggressive", "solid", "blitz")
  movetimeMs?: number;    // optional movetime override (otherwise depth-based)
}

export const BOTS: BotPersonality[] = [
  {
    id: 'bobby-beginner',
    name: 'Bobby',
    emoji: '🐣',
    level: 2,
    approxElo: 1000,
    blurb: 'A friendly beginner. Loves trades and long endgames.',
    badge: 'beginner',
  },
  {
    id: 'tina-tactical',
    name: 'Tina',
    emoji: '⚡',
    level: 8,
    approxElo: 1600,
    blurb: 'Looks for tactics in every position. Will punish hanging pieces.',
    badge: 'tactical',
  },
  {
    id: 'petra-positional',
    name: 'Petra',
    emoji: '🪨',
    level: 12,
    approxElo: 2000,
    blurb: 'Slow squeeze; prefers strong pawn structures and small advantages.',
    badge: 'positional',
  },
  {
    id: 'speedy',
    name: 'Speedy',
    emoji: '🚀',
    level: 14,
    approxElo: 2200,
    blurb: 'Plays instantly. Great sparring partner for blitz.',
    badge: 'blitz',
    movetimeMs: 200,
  },
  {
    id: 'dan-defender',
    name: 'Dan the Wall',
    emoji: '🛡️',
    level: 16,
    approxElo: 2400,
    blurb: 'Hard to break down. Doubles down on king safety.',
    badge: 'solid',
  },
  {
    id: 'maxine-master',
    name: 'GM Maxine',
    emoji: '👑',
    level: 20,
    approxElo: 2700,
    blurb: 'Full-strength Stockfish. Bring popcorn for this one.',
    badge: 'master',
  },
];

export const DEFAULT_BOT = BOTS[1];

export function botById(id: string): BotPersonality {
  return BOTS.find((b) => b.id === id) ?? DEFAULT_BOT;
}
