# AGENTS.md — Auditor Interno de Calidad

## Arquitectura

```
monorepo (npm workspaces)
├── apps/auditorias/     # React 19 SPA (Vite, TailwindCSS 4)
├── apps/dashboard/      # React 19 SPA (shadcn/ui, Recharts)
└── apps/server/         # Express 4 backend (modular)
```

- **Frontend**: React 19 + Vite + TailwindCSS 4 + Firebase Auth
- **Backend**: Node 20 + Express 4 + TypeScript (modular: routes/services/middleware)
- **Base de datos**: Supabase (PostgreSQL) con persistencia dual (DB + memoria local)
- **IA**: AssemblyAI (transcripción), OpenRouter (análisis cognitivo), Ollama (diarización)
- **Despliegue**: Vercel serverless + servidor local (Express + Docker)

## Seguridad aplicada

| Medida | Estado |
|--------|--------|
| Helmet (headers HTTP) | ✅ CSP deshabilitado intencionalmente, resto activo |
| CORS con whitelist | ✅ Orígenes autorizados explícitos |
| Rate limiting global | ✅ 200 req / 15 min |
| Rate limiting login | ✅ 20 req / 15 min |
| JWT con HMAC-SHA256 | ✅ Sin fallback débil, sin legacy token |
| Autenticación proxy OpenRouter | ✅ Requiere JWT Bearer |
| API keys en env vars | ✅ Sin keys hardcodeadas en código |
| Token Drive en sessionStorage | ✅ (vs localStorage anterior) |
| RLS policies en Supabase | ✅ Restringidas por `auth.email()` |
| Sin contraseñas hardcodeadas | ✅ Sin fallbacks en código |
| Error handler global | ✅ No expone stack traces en producción |
| Logging sin datos sensibles | ✅ Logs de auth sin tokens/passwords |

## Estructura del servidor (modular)

```
apps/server/
├── server.ts                  # Punto de entrada (124 líneas)
├── src/
│   ├── config.ts              # Env vars, estado compartido, multer, rate limiter
│   ├── types.ts               # Interfaces compartidas
│   ├── middleware/
│   │   ├── auth.ts            # signToken, verifyToken, authenticateToken
│   │   └── errorHandler.ts    # Error handler global
│   ├── routes/
│   │   ├── auth.ts            # POST /api/login, /api/verify-session, /api/sync-supervisores, /api/set-supervisor-passwords
│   │   ├── calls.ts           # GET/POST/DELETE /api/llamadas, /api/cargar-demo, /api/drive-*
│   │   ├── audio.ts           # POST /api/upload, /api/process-blob, GET /api/audio/:id
│   │   ├── notes.ts           # POST/GET/DELETE /api/llamadas/:id/notas
│   │   ├── objections.ts      # POST/GET/DELETE /api/llamadas/:id/objeciones
│   │   └── transcription.ts   # POST /api/whisper, GET /api/transcript/:callId
│   ├── services/
│   │   ├── supabase.ts        # CRUD para auditorias/notas/objeciones
│   │   ├── openrouter.ts      # callOpenRouter (análisis IA)
│   │   ├── assemblyai.ts      # assemblyAITranscribe (STT)
│   │   └── analysis.ts        # generateLocalAnalysis, guardrails, heuristics
│   └── shared/
│       └── pce-rubric.ts      # Lógica de rúbrica PCE (fuente única de verdad)
├── api/
│   ├── index.ts               # Exporta app Express para Vercel
│   ├── openrouter.ts          # Proxy OpenRouter (requiere JWT)
│   └── whisper.ts             # Transcripción standalone AssemblyAI
└── supabase/migrations/
    ├── 001_create_auditorias.sql
    └── 002_create_notas_objeciones.sql
```

### Flujo de datos (transcripción + auditoría)

```
Audio (MP3/WAV) → AssemblyAI (STT + speaker_labels)
                → OpenRouter (diarización Vendedor/Cliente + 22 parámetros PCE)
                → Guardrails (role reversal check, split consolidado)
                → buildChecklist() (rúbrica PCE)
                → Supabase persist + memoria local
                → Frontend vía polling GET /api/transcript/:callId
```

## Estructura del frontend (apps/auditorias)

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Orquestador principal (742→reducido)
├── config.ts                   # VITE_API_URL
├── types.ts                    # Interfaces completas (SalesCall, Nota, Objecion, etc.)
├── components/
│   ├── AuditorDashboard.tsx    # Dashboard principal (1139→227 líneas)
│   ├── AudioPlayer.tsx         # Reproductor de audio (171 líneas)
│   ├── AudioUpload.tsx         # Subida de archivos (769→359 líneas)
│   ├── AnnotationModal.tsx     # Modal de notas/objeciones (131 líneas)
│   ├── DriveExplorer.tsx       # Explorador de Google Drive (343 líneas)
│   ├── EmotionalAnalysisCard.tsx # Análisis emocional (181 líneas)
│   ├── FileDropzone.tsx        # Zona drag & drop (76 líneas)
│   ├── LoginScreen.tsx         # Pantalla de login
│   ├── PceChecklistCard.tsx    # Rúbrica PCE (173 líneas)
│   └── TranscriptionViewer.tsx # Transcripción con anotaciones (230 líneas)
├── shared/
│   ├── pce-rubric.ts           # Lógica de rúbrica (FUENTE ÚNICA)
│   └── pce-rubric.test.ts      # Tests (12 tests)
├── utils/
│   ├── audioCache.ts           # IndexedDB cache
│   ├── demoData.ts             # Datos demo
│   ├── driveSync.ts            # Sincronización Google Drive
│   ├── firebaseSync.ts         # Sincronización Firebase
│   └── reportGenerator.ts      # PDF/CSV reports
└── lib/
    └── firebase.ts             # Firebase Auth (tokens en sessionStorage)
```

## Comandos

```bash
npm run dev              # Dev server (server.ts + Vite HMR en paralelo)
npm run dev:server       # Solo servidor Express
npm run dev:auditorias   # Solo frontend auditorias
npm run dev:dashboard    # Solo frontend dashboard
npm run build            # Build producción (Vite frontend)
npm run build:server     # Build servidor (esbuild)
npm run lint             # TypeScript check (server + auditorias + dashboard)
npm run test             # Tests (Vitest)
```

## Variables de entorno

| Variable | Obligatoria | Propósito |
|----------|-------------|-----------|
| `JWT_SECRET` | ✅ | HMAC-SHA256 secret (generar con `openssl rand -hex 64`) |
| `ASSEMBLYAI_API_KEY` | ✅ | API key de AssemblyAI |
| `OPENROUTER_API_KEY` | ✅ | API key de OpenRouter |
| `SUPABASE_URL` | ❌ | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | ❌ | Anon key de Supabase |
| `ALLOWED_EMAILS` | ❌ | Fallback emails (separados por coma) |
| `SUPERVISOR_PASSWORD` | ❌ | Password para auth tradicional |
| `APP_URL` | ❌ | URL del applet |
| `OLLAMA_URL` | ❌ | URL de servidor Ollama |
| `OLLAMA_MODEL` | ❌ | Modelo Ollama (default: hermes3) |
| `VITE_API_URL` | ❌ | URL del backend (build-time) |

## API endpoints

### Autenticación
- `POST /api/login` — Login (Google OAuth o password)
- `POST /api/verify-session` — Verificar JWT
- `POST /api/sync-supervisores` — Sincronizar Supabase → Firebase Auth

### Llamadas
- `GET /api/llamadas` — Listar todas
- `DELETE /api/llamadas/:id` — Eliminar una
- `POST /api/cargar-demo` — Cargar caso de prueba

### Audio y transcripción
- `POST /api/upload` — Subir audio (inicia transcripción asíncrona)
- `POST /api/process-blob` — Procesar desde Vercel Blob
- `GET /api/audio/:id` — Stream de audio (soporta Range Requests)
- `GET /api/transcript/:callId` — Polling de estado de transcripción
- `POST /api/whisper` — Transcripción standalone AssemblyAI

### Google Drive
- `POST /api/drive-import` — Importar y auditar desde Drive
- `POST /api/drive-save` — Guardar auditoría en Drive
- `GET /api/drive-history` — Listar historial desde Drive

### Notas y objeciones
- `POST/GET/DELETE /api/llamadas/:id/notas` — CRUD de notas
- `POST/GET/DELETE /api/llamadas/:id/objeciones` — CRUD de objeciones

### Supervisores
- `GET /api/supervisores/:email/historial` — Historial de actividad

## Auth Flow

1. Frontend: `signInWithPopup` (Google) → email + access token
2. Frontend: POST `{ email, displayName }` a `/api/login`
3. Backend: valida contra Supabase (tabla `profiles`, rol admin/coordinador) o `ALLOWED_EMAILS` (fallback)
4. Backend: devuelve JWT (HMAC-SHA256, expira 24h)
5. Frontend: almacena JWT en memoria (no en localStorage)
6. Google Drive token: almacenado en `sessionStorage` (no `localStorage`)
7. Proxy IA: requiere header `Authorization: Bearer <JWT>`

## Testing

```bash
npm run test -w apps/auditorias
```

- Framework: Vitest (co-locado con Vite)
- Tests: 12 tests unitarios para `pce-rubric.ts`
- Cobertura: buildChecklist, evaluateHeuristic, detección de modalidad
- Ejecución automática en CI/CD (pendiente de configurar)

## Deploy (Vercel)

- `apps/server/vercel.json` configura rewrites y serverless functions
- `@vercel/node` debe estar en `dependencies`
- No configurar `"runtime"` en `vercel.json` — Vercel auto-detecta Node.js
- API keys via Environment Variables de Vercel (no en vercel.json)
- Max duration serverless: 60s

## Convenciones de código

- Importaciones con extensión `.js` para compatibilidad ESM
- Estado compartido del servidor en `src/config.ts` con funciones mutadoras
- Tipos fuertes en `types.ts` (evitar `any`)
- Sin secretos hardcodeados (usar env vars siempre)
- Tests co-localizados con el código fuente (`*.test.ts`)
- Componentes React pequeños y enfocados (<250 líneas ideal)
