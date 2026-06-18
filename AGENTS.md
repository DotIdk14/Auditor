# AGENTS.md — Auditor Interno de Calidad

## Architecture

- **Full-stack app**: React 19 (Vite) frontend + Express backend in a single repo
- **Dual runtime**: Backend runs as a real HTTP server locally (`PORT=3000`) and as a Vercel serverless function when deployed. The `if (!process.env.VERCEL)` guard in `server.ts:1765` controls this.
- **Frontend API calls**: The React SPA calls the backend via `VITE_API_URL` env var (`src/config.ts`). In production this is an ngrok URL pointing to the VPS. The SPA does NOT call its own origin for API requests.

## Commands

```bash
npm run dev          # Dev server (tsx server.ts + Vite HMR)
npm run build        # Full production build (3 steps below)
npm run lint         # TypeScript check only (tsc --noEmit)
```

**Build pipeline** (`npm run build`) runs sequentially:
1. `vite build` → outputs SPA to `dist/`
2. `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs`
3. `node ./scripts/obfuscate.js` → obfuscates ALL `.js` files in `dist/` (hex identifiers, string arrays)

There are **no tests** and **no CI workflows** in this repo.

## Vercel Deployment

**Crucial gotchas when deploying:**

- `@vercel/node` MUST be in `dependencies` (not devDependencies) or `api/*.ts` serverless functions will fail to compile.
- Do NOT set `"runtime"` in `vercel.json` → `functions`. Vercel auto-detects Node.js. Setting a raw version string like `"nodejs20.x"` causes `Function Runtimes must have a valid version` error.
- Firebase Google Sign-In requires the deployed Vercel domain to be added in Firebase Console → Authentication → Settings → Authorized Domains. Missing this causes `unauthorized` errors.
- Every commit in the git history must have an email linked to a GitHub account. Vercel rejects deployments otherwise.

**Routing in vercel.json** (order matters):
```
/api/ollama → api/ollama.ts    # must be BEFORE catch-all
/api/whisper → api/whisper.ts  # must be BEFORE catch-all
/api/(.*)   → api/index.ts     # catch-all Express app
/(.*)        → /index.html      # SPA fallback
```

**Serverless functions:**
- `api/index.ts` — exports the full Express app (23MB+). Handles `/api/upload`, `/api/login`, `/api/llamadas`, etc.
- `api/ollama.ts` — thin proxy to `OLLAMA_URL` (ngrok-exposed Ollama on VPS)
- `api/whisper.ts` — thin proxy to `APP_URL/api/whisper` (backend on VPS)
- Max duration for all: **60 seconds** (set in `vercel.json`)

**Required Vercel env vars:**
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend URL the frontend calls (ngrok) |
| `APP_URL` | Backend URL for serverless function proxies |
| `OLLAMA_URL` | Ollama server URL (ngrok) |
| `OLLAMA_MODEL` | Ollama model name (default: `hermes3`) |
| `ALLOWED_EMAILS` | Comma-separated authorized Google login emails |
| `SUPABASE_URL` | Supabase CRM URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key |

## Native Module Warning

`@napi-rs/whisper` is a Rust native addon. It only works on the VPS, NOT on Vercel serverless functions. The Whisper model file (`ggml-small.bin`, ~466MB) is not published to npm — it must be downloaded separately via the package's `download-ggml-model.mjs` script. Vercel whisper calls are proxied to the VPS (`APP_URL/api/whisper`), where the native module actually runs.

## Environment Variables

- `VITE_*` prefixed vars are **build-time only** — burned into the frontend JS bundle
- All other vars are **runtime** — read by the backend or serverless functions
- `.env.local` is gitignored. `.env.example` is the documented template.
- The `dotenv` package loads `.env.local` at startup in `server.ts` (local only; Vercel serverless reads from Vercel env vars)

## Dev Server Quirks

- `npm run dev` uses `tsx server.ts` directly — no pre-build, no obfuscation
- Vite runs in middleware mode, serving the React dev build with HMR
- `DISABLE_HMR=true` env var disables HMR and file watching (used by AI Studio agent)

## Auth Flow

1. Frontend calls Firebase `signInWithPopup` (Google) → gets email + access token
2. Frontend POSTs `{ email, displayName }` to `${VITE_API_URL}/api/login`
3. Backend validates email against Supabase CRM (`profiles` table, `rol: admin/coordinador`) or hardcoded allowlist
4. Backend returns `{ token: "utel-supervisor-session-token" }` (static token)
5. Access token is cached in `localStorage` under `utel_google_drive_token` for Google Drive API access
