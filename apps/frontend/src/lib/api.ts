import { API_URL } from './config';
import type { AnalyzePgnRequest, AnalyzePgnResponse, GameState, PlayerInfo } from '@chess/shared';

export interface AuthResponse {
  token: string;
  user: PlayerInfo & { isGuest: boolean };
}

export interface CreateAiGameBody {
  level: number;
  color?: 'white' | 'black' | 'random';
  initial?: number;
  increment?: number;
}

async function request<T>(path: string, init?: RequestInit & { auth?: string }): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (init?.auth) headers['Authorization'] = `Bearer ${init.auth}`;
  const res = await fetch(`${API_URL}/api${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    let message = text || `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      if (parsed.message) message = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
    } catch {
      /* not json */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  async guest(): Promise<AuthResponse> {
    return request('/auth/guest', { method: 'POST' });
  },
  async signup(username: string, password: string): Promise<AuthResponse> {
    return request('/auth/signup', { method: 'POST', body: JSON.stringify({ username, password }) });
  },
  async login(username: string, password: string): Promise<AuthResponse> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  },
  async upgrade(token: string, username: string, password: string): Promise<AuthResponse> {
    return request('/auth/upgrade', { method: 'POST', body: JSON.stringify({ username, password }), auth: token });
  },
  async me(token: string): Promise<PlayerInfo & { isGuest: boolean }> {
    return request('/auth/me', { auth: token });
  },
  async leaderboard(): Promise<Array<PlayerInfo & { gamesPlayed: number; wins: number; losses: number; draws: number }>> {
    return request('/users/leaderboard');
  },
  async game(id: string): Promise<GameState> {
    return request(`/games/${id}`);
  },
  async createAiGame(token: string, body: CreateAiGameBody): Promise<GameState> {
    return request(`/games/ai`, { method: 'POST', body: JSON.stringify(body), auth: token });
  },
  async bestmove(fen: string, depth = 12): Promise<{ bestMove: string | null; score: number; pv: string[]; depth: number; mate?: number }> {
    return request(`/engine/bestmove`, { method: 'POST', body: JSON.stringify({ fen, depth }) });
  },
  async analyzePgn(body: AnalyzePgnRequest): Promise<AnalyzePgnResponse> {
    return request(`/engine/analyze`, { method: 'POST', body: JSON.stringify(body) });
  },
};
