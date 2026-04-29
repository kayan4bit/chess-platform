# Chess Platform

Open-source chess platform inspired by Lichess. Real-time multiplayer, a roster of Stockfish bot personalities, matchmaking with auto bot-fallback, Elo, and post-game analysis. **No ads. No tracking. No third-party services.** Data lives in a single SQLite file with bcrypt-hashed passwords.

## One-click deploy

| Target | Button | What it deploys |
| --- | --- | --- |
| Render (backend, persistent disk) | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kayan4bit/chess-platform) | NestJS API + Stockfish + 1 GB disk for the SQLite file |
| Fly.io (backend, free volume) | [Deploy](https://fly.io/launch?repo=https://github.com/kayan4bit/chess-platform) | Same backend on Fly's Hobby plan with a free 3 GB persistent volume |
| Cloudflare Pages (frontend) | [![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kayan4bit/chess-platform) | Next.js app on Cloudflare's global edge |
| Vercel (frontend) | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkayan4bit%2Fchess-platform&root-directory=apps%2Ffrontend&env=NEXT_PUBLIC_API_URL,NEXT_PUBLIC_WS_URL&envDescription=URL%20of%20your%20backend) | Same Next.js app on Vercel |

After deploy, set `CORS_ORIGIN` on the backend to your frontend URL and set `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_WS_URL` on the frontend to your backend URL. See [`DEPLOY.md`](./DEPLOY.md) for the full playbook (including how to mount the persistent disk on Render and the persistent volume on Fly.io).

## Privacy

- **No tracking**: zero analytics, zero ads, zero third-party scripts. The frontend talks only to your own backend.
- **No remote DB**: data lives in a single `chess.db` SQLite file on the server. You can `scp` it down at any time and the whole app moves with you.
- **Passwords**: bcrypt-hashed (cost 12) before storage. The plaintext never touches disk.
- **Sessions**: stateless JWT signed with a `JWT_SECRET` that Render/Fly persist across restarts.
- **Settings**: theme/piece set/sound preferences are stored in `localStorage` only — never sent to the server.

## Stack

- **Package manager**: [yarn 1.22.22](https://classic.yarnpkg.com/) (workspaces)
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + Zustand + `react-chessboard` + `chess.js`
- **Backend**: NestJS + Socket.IO + Prisma (SQLite) + `chess.js` + Stockfish + bcrypt
- **Engine**: Stockfish (system binary, bundled in backend Docker image)

## Repo layout

```
apps/
  backend/           # NestJS API + WebSocket gateway + Stockfish worker
  frontend/          # Next.js app
packages/
  shared/            # Shared TypeScript types
render.yaml          # Render blueprint (Docker web service + 1 GB disk)
fly.toml             # Fly.io blueprint (Hobby plan + 3 GB volume)
vercel.json          # Vercel configuration
apps/frontend/wrangler.toml   # Cloudflare Pages configuration
docs/ci-yarn.yml.txt # The yarn-based GitHub Actions workflow (paste over .github/workflows/ci.yml in the GitHub web editor — workflow scope cannot be granted to OAuth pushes)
```

## Local development

Prerequisites: Node.js 20+, [yarn 1.22.22](https://classic.yarnpkg.com/lang/en/docs/install/), Stockfish (`apt install stockfish`).
SQLite needs no install — Prisma will create the file on first run.

```bash
npm install -g yarn@1.22.22
yarn install --ignore-engines
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# Generate Prisma client + create the SQLite schema
yarn workspace @chess/backend prisma:generate
DATABASE_URL=file:./data/chess.db yarn workspace @chess/backend exec prisma db push --skip-generate

# Terminal 1
yarn dev:backend    # http://localhost:4000

# Terminal 2
yarn dev:frontend   # http://localhost:3000
```

## Features

- **Real-time multiplayer** with WebSocket clocks, draw offers, resign, reconnection
- **Matchmaking queue** with bullet/blitz/rapid/classical pools and Elo-aware pairing
- **Auto bot-fallback**: if no human opponent is found within `BOT_FALLBACK_MS` (default 15s), you're paired with Stockfish instead of waiting forever
- **Bot personalities** (`/play/ai`): Bobby, Tina, Petra, Speedy, Dan the Wall, GM Maxine — same Stockfish engine, different skill caps and vibes
- **Six board themes** (Brown, Tournament, Ocean, Walnut, Twilight, Mono) and **six piece sets** (Cburnett, Alpha, Fantasy, Leipzig, Merida, Staunty) via the Lichess CDN
- **Move sounds** (move, capture, check, end) synthesized in the browser via WebAudio — no audio files shipped
- **Elo rating** (K=32, floor 100)
- **Live eval bar** + best move suggestion (opt-in)
- **Post-game analysis**: blunder detection, engine lines, PGN import/export
- **Guest auto-login** (no signup friction) and **username + password** accounts (bcrypt-hashed in SQLite). Guests can upgrade to a registered account without losing their rating.
- **Rate limiting** (default 240/min, engine endpoints 30/min) enforced globally
- **Persistent Stockfish session** per `/engine/analyze` request — ~10× faster than spawn-per-ply

## Configuration

Backend env vars (`apps/backend/.env`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `file:./data/chess.db` | SQLite file path. Mount a persistent disk over `apps/backend/prisma/data/` in production. |
| `REDIS_URL` | — | Optional. Enables cross-instance matchmaking queue. |
| `JWT_SECRET` | `change-me-in-production` | JWT signing key — Render/Fly generate this once and persist it. |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated list of allowed frontend origins. |
| `STOCKFISH_PATH` | auto-detect | Path to the Stockfish binary. |
| `BOT_FALLBACK_MS` | `15000` | Queue wait before auto-matching to Stockfish (0 to disable). |
| `BOT_FALLBACK_LEVEL` | `6` | Stockfish skill level for bot fallbacks (0–20). |
| `PORT` | `4000` | HTTP port. |

Frontend env vars (`apps/frontend/.env.local`):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Public URL of the backend API. |
| `NEXT_PUBLIC_WS_URL` | Usually the same URL as `NEXT_PUBLIC_API_URL`. |

## License

AGPL-3.0 (same spirit as Lichess).
