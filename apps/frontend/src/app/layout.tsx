import '../styles/globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'UCX Chess',
  description: 'UCX Chess — privacy-first, open-source chess. Play online, vs Stockfish bots, and analyze your games. Founded 2023 by Kayan Erkama.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-neutral-500 border-t border-neutral-900 mt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-neutral-400">UCX Chess</span> — a UCX project, founded 2023 by Kayan Erkama. Powered by Stockfish.
            </div>
            <nav className="flex gap-4">
              <Link href="/about" className="hover:text-neutral-300">About</Link>
              <Link href="/privacy" className="hover:text-neutral-300">Privacy</Link>
              <Link href="/terms" className="hover:text-neutral-300">Terms</Link>
              <a href="https://github.com/kayan4bit/chess-platform" target="_blank" rel="noreferrer noopener" className="hover:text-neutral-300">Source</a>
            </nav>
          </div>
          <div className="mt-2 text-xs text-neutral-600">
            No ads. No analytics. No third-party tracking. Your data lives in one SQLite file.
          </div>
        </footer>
      </body>
    </html>
  );
}
