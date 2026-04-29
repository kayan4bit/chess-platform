export const metadata = {
  title: 'Terms of Service — UCX Chess',
  description: 'Terms of service for UCX Chess.',
};

export default function TermsPage() {
  return (
    <article className="prose prose-invert max-w-2xl space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        <p className="text-neutral-400 text-sm">Effective: 2023. Last reviewed: today.</p>
      </header>

      <p className="text-neutral-300">
        Welcome to UCX Chess — a UCX project founded 2023 by Kayan Erkama. By using this service,
        you agree to the terms below. They&apos;re short on purpose.
      </p>

      <h2 className="text-xl font-semibold text-white">1. Be decent</h2>
      <p className="text-neutral-300">
        Don&apos;t cheat (no engine assistance against humans), don&apos;t harass other players in chat,
        and don&apos;t try to break the service. Accounts found doing any of the above may be removed
        without notice. Engine assistance is fine — and explicitly intended — when playing the bot
        opponents on the <code>/play/ai</code> screen.
      </p>

      <h2 className="text-xl font-semibold text-white">2. Account</h2>
      <p className="text-neutral-300">
        You&apos;re responsible for keeping your password safe. Passwords are bcrypt-hashed (we can&apos;t
        recover them — only reset them). Guest accounts are tied to your browser; clearing storage
        loses the guest. Save a real account if you want your rating to persist across devices.
      </p>

      <h2 className="text-xl font-semibold text-white">3. Service availability</h2>
      <p className="text-neutral-300">
        UCX Chess is provided as-is, free of charge, with no uptime SLA. Game state is durable
        (stored in a SQLite file with persistent disk in production), but live games may be
        interrupted by deploys; reconnect and play resumes from the last known position.
      </p>

      <h2 className="text-xl font-semibold text-white">4. Open source</h2>
      <p className="text-neutral-300">
        UCX Chess is licensed under AGPL-3.0. You&apos;re free to fork, host, and modify it. If you
        host a modified version, you must share your source under the same license.
      </p>

      <h2 className="text-xl font-semibold text-white">5. Liability</h2>
      <p className="text-neutral-300">
        UCX Chess is provided &quot;as is&quot; without warranty of any kind. The maintainers, the UCX
        project, and Kayan Erkama are not liable for any damages arising from use of the software.
      </p>

      <h2 className="text-xl font-semibold text-white">6. Changes</h2>
      <p className="text-neutral-300">
        These terms may be updated. Material changes will be announced on the GitHub repository.
      </p>
    </article>
  );
}
