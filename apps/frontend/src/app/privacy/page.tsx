export const metadata = {
  title: 'Privacy Policy — UCX Chess',
  description: 'How UCX Chess handles your data — short version: we don\u2019t want it.',
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-2xl space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="text-neutral-400 text-sm">Effective: 2023. Last reviewed: today.</p>
      </header>

      <p className="text-neutral-300">
        UCX Chess is a UCX project founded 2023 by Kayan Erkama. We aim to collect as little data
        about you as physically possible. This page explains exactly what is collected, why, and how long it stays.
      </p>

      <h2 className="text-xl font-semibold text-white">1. What we store</h2>
      <ul className="text-neutral-300 list-disc pl-6 space-y-1">
        <li><strong>Account record</strong>: your username, your bcrypt-hashed password (never the plaintext), and your Elo rating + game counters.</li>
        <li><strong>Game history</strong>: PGN, FEN, time controls, and timestamps for games you played on this server.</li>
        <li><strong>Session token</strong>: a stateless JWT in your browser&apos;s <code>localStorage</code>. Cleared the moment you click &quot;Sign out&quot;.</li>
        <li><strong>UI preferences</strong>: your chosen board theme, piece set, and sound toggle. Stored in your browser&apos;s <code>localStorage</code> only — never sent to the server.</li>
      </ul>

      <h2 className="text-xl font-semibold text-white">2. What we don&apos;t store</h2>
      <ul className="text-neutral-300 list-disc pl-6 space-y-1">
        <li>No email, no phone number, no real name. Username + password is the entire profile.</li>
        <li>No cookies beyond the session JWT.</li>
        <li>No analytics, no ad pixels, no fingerprinting, no third-party scripts.</li>
        <li>No location data, no IP logs beyond standard server logs (which auto-rotate).</li>
      </ul>

      <h2 className="text-xl font-semibold text-white">3. Where it lives</h2>
      <p className="text-neutral-300">
        All persistent data is in a single SQLite file (<code>chess.db</code>) on the server hosting this instance.
        It is not shared with, sold to, or sent to any third party. If you self-host UCX Chess,
        the file lives on <em>your</em> server — we have no access to it.
      </p>

      <h2 className="text-xl font-semibold text-white">4. Passwords</h2>
      <p className="text-neutral-300">
        Passwords are hashed with bcrypt at cost factor 12 before they hit disk. The plaintext is
        never persisted, never logged, and never sent over the network in cleartext (HTTPS only in
        production). UCX Chess cannot recover a forgotten password — only reset it.
      </p>

      <h2 className="text-xl font-semibold text-white">5. Stockfish</h2>
      <p className="text-neutral-300">
        Engine analysis runs on the same server as the API. Position FEN strings are sent to a local
        Stockfish process via UCI. Nothing leaves the server.
      </p>

      <h2 className="text-xl font-semibold text-white">6. Your rights</h2>
      <ul className="text-neutral-300 list-disc pl-6 space-y-1">
        <li><strong>Access</strong>: every game you played is yours — export PGN any time on the analysis page.</li>
        <li><strong>Deletion</strong>: contact the operator of the instance to delete your account. On the reference instance, that&apos;s the email below.</li>
        <li><strong>Portability</strong>: the entire user record and history can be dumped from SQLite by the instance operator on request.</li>
      </ul>

      <h2 className="text-xl font-semibold text-white">7. Contact</h2>
      <p className="text-neutral-300">
        UCX project · founder Kayan Erkama. Open an issue at{' '}
        <a className="text-brand hover:underline" href="https://github.com/kayan4bit/chess-platform/issues">github.com/kayan4bit/chess-platform/issues</a>.
      </p>
    </article>
  );
}
