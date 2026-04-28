# Deploying UCX Chess

UCX Chess ships as **one Docker image** for the backend (NestJS + Stockfish + a single SQLite file) and a static **Next.js** bundle for the frontend. Pick **one backend host** and **one frontend host**.

> **Privacy note** — there is no remote database. All persistent state lives in `apps/backend/prisma/data/chess.db` inside the backend container. To survive restarts in production you **must** mount a persistent disk/volume at that path. Both blueprints below do this.

## Backend — Render (recommended, $7/mo for the disk)

Click **Deploy to Render** in the [README](./README.md#one-click-deploy). It reads [`render.yaml`](./render.yaml) and provisions:

- `ucx-chess-backend` — Docker web service (NestJS + Stockfish), `starter` plan
- A persistent **1 GB disk** mounted at `/app/apps/backend/prisma/data` (where `chess.db` lives)
- `JWT_SECRET` generated once via `generateValue: true` and persisted across restarts (no rotation on deploy)
- `BOT_FALLBACK_MS=15000`, `BOT_FALLBACK_LEVEL=6` (auto-bot kicks in after 15s of queueing alone)

The Dockerfile installs the `stockfish` apt package so the binary is present at `/usr/games/stockfish`. On boot the container runs `prisma db push --accept-data-loss --skip-generate` (idempotent; SQLite has no migration flow on first deploy) then `node dist/main.js`.

After the web service is live, copy its public URL (e.g. `https://ucx-chess-backend-xxxx.onrender.com`) and set `CORS_ORIGIN` on the service to your frontend origin.

> Render's free plan does **not** support persistent disks. If you need a true free tier, use Fly below.

## Backend — Fly.io (free tier, 3 GB volume)

`fly.toml` is pre-configured. Once you have the `flyctl` CLI installed and `fly auth login`:

```bash
fly launch --copy-config --no-deploy             # picks region, creates the app
fly volumes create chess_data --size 3 --region <your-region>
fly secrets set JWT_SECRET=$(openssl rand -hex 32)
fly deploy
```

The volume is mounted at `/data` and `DATABASE_URL=file:/data/chess.db` is already set in `fly.toml`. Volumes survive `fly deploy`, machine restarts, and region migrations.

## Frontend — Cloudflare Pages (recommended)

Dashboard:

1. Cloudflare → Workers & Pages → **Create** → Pages → Connect to Git → pick the fork.
2. Framework preset: **Next.js**.
3. Build command: `npm install -g yarn@1.22.22 && yarn install --frozen-lockfile --ignore-engines && yarn workspace @chess/frontend build`
4. Build output directory: `apps/frontend/.next`
5. Root directory: `/`
6. Env vars:
   - `NEXT_PUBLIC_API_URL` → `https://<your-backend>.onrender.com` (or Fly URL)
   - `NEXT_PUBLIC_WS_URL` → same value (Socket.IO upgrades to WS)
   - `NODE_VERSION` → `20`

CLI alternative:

```bash
cd apps/frontend
yarn install --frozen-lockfile --ignore-engines
yarn build
npx wrangler pages deploy .next --project-name ucx-chess
```

## Frontend — Vercel (alternative)

`vercel.json` is preconfigured. Either click the deploy button in the README or:

```bash
npx vercel --yes --cwd apps/frontend
npx vercel env add NEXT_PUBLIC_API_URL production
npx vercel env add NEXT_PUBLIC_WS_URL production
npx vercel deploy --prod --cwd apps/frontend
```

## Self-Healing CI (optional)

UCX Chess includes `yarn heal` — a CLI that runs `typecheck → lint → test → build`, and on failure ships the failing file + error to OpenRouter for an auto-patch via `git apply --check`. To enable it in CI, copy `docs/promote-run.yaml.txt` into `.github/workflows/promote-run.yml` (the OAuth push from this fork can't write workflow files) and set the repo secret:

- `OPENROUTER_API_KEY` → an OpenRouter API key (free at <https://openrouter.ai>)

The workflow runs on every push to `main`; if anything fails, it tries to heal and pushes the fix back as a `chore(heal)` commit.

## Post-deploy checklist

- [ ] Backend `CORS_ORIGIN` set to the frontend origin
- [ ] Frontend `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` set to backend URL
- [ ] Visit `https://<backend>/health` → expect `{ "ok": true, "ts": ... }`
- [ ] Visit the frontend root — a guest session is created automatically; the badge should say `guest_xxxx`
- [ ] Open `/settings` (drawer) → switch board theme + piece set → reload, preferences persist
- [ ] Open `/play/ai` → pick a personality → make a move → bot responds within ~1s
- [ ] Queue at `/play` — after ~15s with no opponent you're paired with the auto-bot fallback

## Troubleshooting

**SQLite file disappears on redeploy** — the disk/volume is not mounted at the right path. Render: re-check `disk.mountPath` in `render.yaml`. Fly: `fly volumes list` and confirm `chess_data` is attached.

**`CORS` errors** — `CORS_ORIGIN` on the backend must match the exact frontend origin (scheme + host + optional port). Comma-separate multiple values.

**WebSocket falls back to polling** — fine; Socket.IO long-polling works on every network. Don't fight it.

**`Stockfish not found`** — only happens outside Docker. Set `STOCKFISH_PATH` to the absolute path of your `stockfish` binary.

**`yarn heal` does nothing** — set `OPENROUTER_API_KEY` (or `openrouter`) in your env. Confirm with `yarn heal --dry-run`.
