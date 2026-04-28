'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Chess } from 'chess.js';
import { Board } from '@/components/Board';
import { Clock } from '@/components/Clock';
import { EvalBar } from '@/components/EvalBar';
import { useSession } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { sfx } from '@/lib/sounds';
import { useSettings } from '@/lib/settings';
import type { GameState, ServerEvent } from '@chess/shared';

export default function GamePage() {
  const params = useParams<{ id: string }>();
  const gameId = params.id;
  const { token, user, hydrate } = useSession();
  const { soundEnabled, hydrate: hydrateSettings } = useSettings();
  const [state, setState] = useState<GameState | null>(null);
  const [evalScore, setEvalScore] = useState<number | null>(null);
  const [showEval, setShowEval] = useState(false);
  const [chat, setChat] = useState<Array<{ from: string; text: string; at: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [drawOfferedBy, setDrawOfferedBy] = useState<'white' | 'black' | null>(null);
  const chessRef = useRef(new Chess());
  const [displayFen, setDisplayFen] = useState<string>('start');
  const [whiteClock, setWhiteClock] = useState(0);
  const [blackClock, setBlackClock] = useState(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => { hydrate(); hydrateSettings(); }, [hydrate, hydrateSettings]);

  // Play sounds whenever the position advances. Compares previous and new
  // PGN length so we react to opponent moves and engine moves equally.
  const lastPliesRef = useRef(0);
  useEffect(() => {
    if (!state || !soundEnabled) return;
    const tmp = new Chess();
    tmp.loadPgn(state.pgn || '', { strict: false });
    const plies = tmp.history().length;
    if (plies > lastPliesRef.current) {
      const last = tmp.history({ verbose: true }).pop();
      if (last) {
        if (state.status !== 'in_progress') sfx.end();
        else if (last.san?.includes('+') || last.san?.includes('#')) sfx.check();
        else if (last.captured) sfx.capture();
        else sfx.move();
      }
    } else if (plies < lastPliesRef.current && state.status !== 'in_progress') {
      sfx.end();
    }
    lastPliesRef.current = plies;
  }, [state, soundEnabled]);

  useEffect(() => {
    if (!token || !gameId) return;
    const sock = getSocket(token);

    const onServer = (evt: ServerEvent) => {
      if (evt.type === 'welcome') return;
      if (evt.type === 'game_state' || evt.type === 'match_found' || evt.type === 'game_over') {
        const g = evt.type === 'match_found' ? evt.game : evt.game;
        if (g.id !== gameId) return;
        setState(g);
        chessRef.current = new Chess();
        if (g.pgn) chessRef.current.loadPgn(g.pgn, { strict: false });
        setDisplayFen(chessRef.current.fen());
        setWhiteClock(g.clocks.white);
        setBlackClock(g.clocks.black);
        setDrawOfferedBy(null);
      } else if (evt.type === 'chat') {
        setChat((prev) => [...prev.slice(-49), { from: evt.from, text: evt.text, at: evt.at }]);
      } else if (evt.type === 'draw_offered') {
        setDrawOfferedBy(evt.by);
      } else if (evt.type === 'error') {
        // eslint-disable-next-line no-console
        console.error(evt.message);
      }
    };

    const onConnect = () => {
      sock.emit('join', { gameId });
    };

    sock.on('connect', onConnect);
    sock.on('server', onServer);
    if (sock.connected) onConnect();

    return () => {
      sock.off('connect', onConnect);
      sock.off('server', onServer);
    };
  }, [token, gameId]);

  // client-side clock tick (interpolated)
  useEffect(() => {
    if (!state || state.status !== 'in_progress') {
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    const start = performance.now();
    const startW = state.clocks.white;
    const startB = state.clocks.black;
    const turn = state.turn;
    tickRef.current = window.setInterval(() => {
      const elapsed = performance.now() - start;
      if (turn === 'white') { setWhiteClock(Math.max(0, startW - elapsed)); setBlackClock(startB); }
      else { setBlackClock(Math.max(0, startB - elapsed)); setWhiteClock(startW); }
    }, 100);
    return () => {
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
    };
  }, [state]);

  const myColor: 'white' | 'black' | null = useMemo(() => {
    if (!state || !user) return null;
    if (state.players.white.id === user.id) return 'white';
    if (state.players.black.id === user.id) return 'black';
    return null;
  }, [state, user]);

  const boardOrientation = myColor ?? 'white';

  const canMove = useCallback((from: string, to: string): boolean => {
    if (!state || !myColor || state.status !== 'in_progress') return false;
    if (state.turn !== myColor) return false;
    const piece = chessRef.current.get(from as `${'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'}${1|2|3|4|5|6|7|8}`);
    if (!piece) return false;
    const pieceColor = piece.color === 'w' ? 'white' : 'black';
    if (pieceColor !== myColor) return false;
    void to;
    return true;
  }, [state, myColor]);

  const onDrop = useCallback((from: string, to: string): boolean => {
    if (!state || !token) return false;
    if (!canMove(from, to)) return false;
    const piece = chessRef.current.get(from as `${'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'}${1|2|3|4|5|6|7|8}`);
    const isPromotion = piece?.type === 'p' && (to.endsWith('1') || to.endsWith('8'));
    const move = { from, to, promotion: isPromotion ? 'q' : undefined } as const;
    // Optimistic board update
    const copy = new Chess(chessRef.current.fen());
    const applied = copy.move({ from, to, promotion: isPromotion ? 'q' : undefined });
    if (!applied) return false;
    chessRef.current = copy;
    setDisplayFen(copy.fen());
    const sock = getSocket(token);
    sock.emit('move', { gameId, move });
    return true;
  }, [gameId, canMove, state, token]);

  const resign = () => { if (token) getSocket(token).emit('resign', { gameId }); };
  const offerDraw = () => { if (token) getSocket(token).emit('offer_draw', { gameId }); };
  const acceptDraw = () => { if (token) getSocket(token).emit('accept_draw', { gameId }); };
  const declineDraw = () => { if (token) { getSocket(token).emit('decline_draw', { gameId }); setDrawOfferedBy(null); } };
  const sendChat = () => {
    if (!chatInput.trim() || !token) return;
    getSocket(token).emit('chat', { gameId, text: chatInput.trim() });
    setChatInput('');
  };

  // Evaluation polling
  useEffect(() => {
    if (!showEval || !state || state.status !== 'in_progress') { setEvalScore(null); return; }
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.bestmove(chessRef.current.fen(), 10);
        if (!cancelled) setEvalScore(res.score);
      } catch {
        /* ignore */
      }
    };
    poll();
  }, [showEval, displayFen, state]);

  if (!state) return <div className="text-neutral-400">Loading game…</div>;

  const topPlayer = boardOrientation === 'white' ? state.players.black : state.players.white;
  const bottomPlayer = boardOrientation === 'white' ? state.players.white : state.players.black;
  const topClock = boardOrientation === 'white' ? blackClock : whiteClock;
  const bottomClock = boardOrientation === 'white' ? whiteClock : blackClock;
  const topActive = state.status === 'in_progress' && state.turn === (boardOrientation === 'white' ? 'black' : 'white');
  const bottomActive = state.status === 'in_progress' && state.turn === boardOrientation;
  const gameOver = state.status !== 'in_progress';
  const drawOfferedToMe = drawOfferedBy && myColor && drawOfferedBy !== myColor;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[64px_minmax(0,1fr)_320px] gap-4">
      <div className="hidden lg:block h-[min(80vh,640px)]">
        {showEval && <EvalBar score={evalScore} orientation={boardOrientation} />}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-300">{topPlayer.username} <span className="text-neutral-500">({topPlayer.rating})</span></div>
          <Clock ms={topClock} active={topActive} label={boardOrientation === 'white' ? 'black' : 'white'} />
        </div>
        <div className="aspect-square">
          <Board
            position={displayFen}
            boardOrientation={boardOrientation}
            onPieceDrop={(from: string, to: string) => onDrop(from, to)}
            arePiecesDraggable={!gameOver && !!myColor}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-300">{bottomPlayer.username} <span className="text-neutral-500">({bottomPlayer.rating})</span></div>
          <Clock ms={bottomClock} active={bottomActive} label={boardOrientation} />
        </div>
      </div>
      <aside className="space-y-3">
        <div className="card">
          {gameOver ? (
            <div className="space-y-2">
              <div className="text-lg font-semibold text-white">
                {state.status === 'draw' ? 'Draw' : state.status === 'white_win' ? 'White wins' : state.status === 'black_win' ? 'Black wins' : 'Aborted'}
              </div>
              <div className="text-sm text-neutral-400">{state.endReason?.replace(/_/g, ' ')}</div>
              {state.players.white.ratingDelta != null && (
                <div className="text-sm">
                  White {state.players.white.ratingDelta >= 0 ? '+' : ''}{state.players.white.ratingDelta} · Black {state.players.black.ratingDelta! >= 0 ? '+' : ''}{state.players.black.ratingDelta}
                </div>
              )}
              <a href={`/analysis?pgn=${encodeURIComponent(state.pgn)}`} className="btn-outline text-sm">Analyze game</a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {!!myColor && <button className="btn-outline text-sm" onClick={offerDraw}>Offer draw</button>}
              {!!myColor && <button className="btn-outline text-sm" onClick={resign}>Resign</button>}
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showEval} onChange={(e) => setShowEval(e.target.checked)} /> Show evaluation bar
              </label>
            </div>
          )}
          {drawOfferedToMe && (
            <div className="mt-3 rounded-md border border-amber-800 bg-amber-950/40 p-3 text-sm">
              Opponent offered a draw.
              <div className="flex gap-2 mt-2">
                <button className="btn text-xs" onClick={acceptDraw}>Accept</button>
                <button className="btn-outline text-xs" onClick={declineDraw}>Decline</button>
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <div className="text-sm font-medium text-white mb-2">Moves</div>
          <div className="font-mono text-xs text-neutral-300 grid grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-0.5 max-h-56 overflow-auto">
            {Array.from({ length: Math.ceil(state.moves.length / 2) }).map((_, i) => (
              <div key={i} className="contents">
                <div className="text-neutral-500">{i + 1}.</div>
                <div>{state.moves[i * 2] ?? ''}</div>
                <div>{state.moves[i * 2 + 1] ?? ''}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="text-sm font-medium text-white mb-2">Chat</div>
          <div className="h-40 overflow-auto text-sm text-neutral-300 space-y-1">
            {chat.map((c, i) => (
              <div key={i}><span className="text-neutral-500">{c.from}:</span> {c.text}</div>
            ))}
            {chat.length === 0 && <div className="text-neutral-500 text-xs">No messages yet.</div>}
          </div>
          <div className="flex gap-2 mt-2">
            <input className="input flex-1 text-sm" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="Say something…" />
            <button onClick={sendChat} className="btn-outline text-sm">Send</button>
          </div>
        </div>
      </aside>
    </section>
  );
}
