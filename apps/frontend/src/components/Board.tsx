'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { getBoardTheme, getPieceSet, useSettings } from '@/lib/settings';

// react-chessboard ships with window-only references; load it client-side only.
const Chessboard = dynamic(
  () => import('react-chessboard').then((m) => m.Chessboard),
  { ssr: false, loading: () => <div className="aspect-square w-full bg-neutral-900 rounded animate-pulse" /> },
);

type ChessboardProps = ComponentProps<typeof Chessboard>;
export type BoardProps = Omit<ChessboardProps, 'customLightSquareStyle' | 'customDarkSquareStyle' | 'customPieces'>;

const PIECES = ['wK','wQ','wR','wB','wN','wP','bK','bQ','bR','bB','bN','bP'] as const;
type PieceKey = typeof PIECES[number];

/** Converts react-chessboard's piece codes (e.g. "wK") to Lichess CDN filenames. */
function pieceUrl(base: string, code: PieceKey): string {
  return `${base}/${code}.svg`;
}

export function Board(props: BoardProps) {
  const { theme, pieceSet, hydrate, showCoords } = useSettings();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { hydrate(); setHydrated(true); }, [hydrate]);

  const t = getBoardTheme(theme);
  const set = getPieceSet(pieceSet);

  const customPieces = useMemo(() => {
    // We hydrate from localStorage on mount; until that happens render with the
    // default set so SSR and first paint match.
    if (!hydrated) return undefined;
    const out: Record<string, (p: { squareWidth: number }) => JSX.Element> = {};
    for (const code of PIECES) {
      const url = pieceUrl(set.base, code);
      out[code] = ({ squareWidth }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={code}
          width={squareWidth}
          height={squareWidth}
          draggable={false}
          style={{ pointerEvents: 'none' }}
        />
      );
    }
    return out;
  }, [hydrated, set.base]);

  return (
    <Chessboard
      {...props}
      customLightSquareStyle={{ backgroundColor: t.light }}
      customDarkSquareStyle={{ backgroundColor: t.dark }}
      customPieces={customPieces}
      showBoardNotation={showCoords}
      animationDuration={180}
      customBoardStyle={{
        borderRadius: 8,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4)',
      }}
    />
  );
}
