import Link from 'next/link';

export default function Home() {
  return (
    <section className="space-y-12">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Play chess. <span className="text-brand">Anywhere.</span> Free. Private.
          </h1>
          <p className="text-neutral-300 text-lg">
            Real-time multiplayer with auto bot-fallback, a Stockfish ladder of personalities, post-game analysis with
            blunder detection, PGN import/export, six board themes, and six piece sets. No ads. No tracking. One self-contained
            SQLite file.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/play" className="btn">Play online</Link>
            <Link href="/play/ai" className="btn-outline">Play vs Bots</Link>
            <Link href="/analysis" className="btn-outline">Analyze PGN</Link>
            <Link href="/login" className="btn-outline">Sign in</Link>
          </div>
          <p className="text-xs text-neutral-500 pt-1">
            No signup needed — you&apos;re already a guest. Save your rating any time on the Sign in page.
          </p>
        </div>
        <div className="card overflow-hidden p-0">
          <div
            className="aspect-square w-full"
            style={{
              backgroundImage:
                'repeating-conic-gradient(#779556 0% 25%, #ebecd0 0% 50%)',
              backgroundSize: '25% 25%',
              backgroundPosition: '0 0',
            }}
          >
            <div className="grid place-items-center h-full text-[8rem] drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">♞</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Feature title="Real-time multiplayer" body="WebSocket gameplay with clocks, premoves, draw offers, resign, and reconnection." />
        <Feature title="Bots that don't make you wait" body="Queue alone? After 15s we pair you with Stockfish at your level — no infinite searching." />
        <Feature title="Post-game analysis" body="Paste a PGN or open a finished game, get blunder/mistake/inaccuracy classification with engine lines." />
        <Feature title="Six board themes, six pieces" body="Brown · Tournament · Ocean · Walnut · Twilight · Mono — paired with Cburnett, Alpha, Fantasy, Leipzig, Merida, Staunty." />
        <Feature title="Privacy-first" body="No ads, no analytics, no third-party trackers. All data lives in a single SQLite file. Passwords are bcrypt-hashed." />
        <Feature title="Free + open" body="MIT licensed. Deploy your own with one click to Render or Fly.io. Frontend deploys free to Cloudflare Pages." />
      </div>
    </section>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-sm text-neutral-400 mt-1">{body}</p>
    </div>
  );
}
