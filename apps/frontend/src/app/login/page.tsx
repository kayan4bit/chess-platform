'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/store';
import { api } from '@/lib/api';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const { setSession, token, user } = useSession();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const upgrading = mode === 'signup' && token && user?.isGuest;
      const res = upgrading
        ? await api.upgrade(token!, username, password)
        : mode === 'signup'
          ? await api.signup(username, password)
          : await api.login(username, password);
      setSession(res.token, res.user);
      router.push('/play');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
        <p className="text-neutral-400 text-sm mt-1">
          {mode === 'signup'
            ? 'Username + password. Stored bcrypt-hashed in a SQLite file. No email, no tracking.'
            : 'Sign in to keep your rating and game history.'}
        </p>
      </div>

      <div className="card space-y-4">
        <div className="flex rounded border border-neutral-800 overflow-hidden text-sm">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 ${mode === 'login' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 ${mode === 'signup' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-sm text-neutral-400">Username</span>
            <input
              autoFocus
              required
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_-]+"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input w-full mt-1"
              placeholder="3–24 chars: letters, numbers, _ and -"
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-400">Password</span>
            <input
              type="password"
              required
              minLength={8}
              maxLength={200}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full mt-1"
              placeholder="At least 8 characters"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </label>
          {mode === 'signup' && (
            <label className="block">
              <span className="text-sm text-neutral-400">Confirm password</span>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input w-full mt-1"
                autoComplete="new-password"
              />
            </label>
          )}
          {error && <div className="text-sm text-red-400">{error}</div>}
          <button disabled={busy} className="btn w-full">
            {busy ? 'Working…' : mode === 'signup' ? (user?.isGuest ? 'Upgrade guest account' : 'Create account') : 'Sign in'}
          </button>
        </form>

        {mode === 'signup' && user?.isGuest && (
          <p className="text-xs text-neutral-500">
            Your current guest rating ({user.rating}) carries over.
          </p>
        )}
      </div>

      <div className="text-center text-sm text-neutral-500">
        Or just <Link href="/play" className="text-brand hover:underline">play as a guest</Link> — no signup required.
      </div>
    </section>
  );
}
