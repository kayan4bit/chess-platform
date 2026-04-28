import Link from 'next/link';

export const metadata = {
  title: 'About — UCX Chess',
  description: 'A UCX project, founded 2023 by Kayan Erkama.',
};

export default function AboutPage() {
  return (
    <article className="prose prose-invert max-w-2xl space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-white">About UCX Chess</h1>
        <p className="text-neutral-400 text-sm">A UCX project · founded 2023 by Kayan Erkama</p>
      </header>

      <p className="text-neutral-300">
        UCX Chess is a self-hosted chess platform that takes Lichess&apos; spirit — fast, free, ad-free,
        privacy-respecting — and ships it as a single Docker image you can run on your own server.
        No remote database, no analytics SDKs, no third-party scripts. Your games and ratings live
        in one SQLite file you can <code>scp</code> down at any time.
      </p>

      <h2 className="text-xl font-semibold text-white">Principles</h2>
      <ul className="text-neutral-300 list-disc pl-6 space-y-1">
        <li><strong>Privacy by default.</strong> Zero trackers, zero ads. Settings are stored locally in your browser.</li>
        <li><strong>Self-contained.</strong> One Docker image, one SQLite file, one Stockfish binary. Yours forever.</li>
        <li><strong>No friction.</strong> Guests can play instantly, no signup. Save your account whenever you&apos;re ready.</li>
        <li><strong>No infinite waiting.</strong> If nobody&apos;s queued for your time control, Stockfish jumps in.</li>
      </ul>

      <h2 className="text-xl font-semibold text-white">Founder</h2>
      <p className="text-neutral-300">
        Created in 2023 by <strong>Kayan Erkama</strong> as part of the UCX project line.
        Contributions, forks, and bug reports are welcome on{' '}
        <a href="https://github.com/kayan4bit/chess-platform" className="text-brand hover:underline">GitHub</a>.
      </p>

      <h2 className="text-xl font-semibold text-white">License</h2>
      <p className="text-neutral-300">
        AGPL-3.0 — same spirit as Lichess. Modify it, host it, share it. Send improvements back upstream
        and everyone wins.
      </p>

      <div className="flex gap-3 pt-2">
        <Link href="/play" className="btn">Start playing</Link>
        <Link href="/privacy" className="btn-outline">Read the privacy policy</Link>
      </div>
    </article>
  );
}
