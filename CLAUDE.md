# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Dream Heist is an interactive Inception-themed GenAI demo for live audiences. Audience members vote on phones via QR code across 5 "dream layer" questions. Votes are translated into a product concept, then a pipeline of themed AI agents generates a full build prompt package. A second phase can spawn actual Claude Code processes to build the product live.

## Commands

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run lint` — ESLint (uses `eslint` directly, config in `eslint.config.mjs`)
- No test framework is configured in the main app

## Architecture

**Next.js 16 App Router** with React 19, Tailwind CSS 4, TypeScript, and better-sqlite3 for persistence.

### Key Routes

| Route | Purpose |
|---|---|
| `/` | Home / session creation |
| `/join/[sessionId]` | Audience voting page (mobile) |
| `/present/[sessionId]` | Presenter view (big screen) |
| `/dream-lab/[sessionId]` | Build visualization page |
| `/backdoor/control/[sessionId]` | Admin control panel |

### API Routes

- `POST /api/session` — session lifecycle (actions: `create`, `start-polling`, `close-polling`, `orchestrate`, `reset`, `rerun-agent`)
- `POST /api/vote` — cast a vote; `GET` returns counts
- `GET /api/events/[sessionId]` — SSE stream for real-time updates
- `GET /api/artifacts?sessionId=` — retrieve generated artifacts
- `POST /api/build` — launch/stop Claude Code build processes (actions: `launch`, `stop`)

### Session Lifecycle

`created` → `polling` → `extracting` → `orchestrating` → `complete`

1. Presenter creates session, audience joins via QR
2. `start-polling` opens all 5 questions at once (voters go at own pace)
3. `close-polling` tallies winners (random tiebreak), runs translation
4. `orchestrate` triggers the agent pipeline
5. Pipeline completes → master build prompt is compiled

### Agent Pipeline (`src/lib/agents/pipeline.ts`)

Sequential with parallel middle stage, plus theatrical pacing delays:
```
Extractor → [Forger + Architect] (parallel) → Builder → Auditor
```

Each agent gets a prompt built from the translation result plus upstream outputs. Runs against Claude API if `ANTHROPIC_API_KEY` is set, otherwise uses fallback outputs (`src/lib/agents/fallback.ts`).

### Build Phase (`src/lib/agents/build-manager.ts`)

After the prompt pipeline, an optional build phase spawns real Claude Code CLI processes:
- Phase 1: Cobb (extractor/scaffolding, haiku)
- Phase 2: Ariadne (pages, sonnet) + Eames (components, sonnet) + Yusuf (API/backend, sonnet) + Mal (tests, opus) + Arthur (review/integration, opus) — all in parallel

Each agent has file ownership boundaries defined in `src/lib/agents/personalities.ts`. Build output goes to `builds/session-{id}/`. Events are persisted to SQLite and broadcast via SSE.

### Real-time (`src/lib/realtime/sse.ts`)

In-memory SSE client map per session. `broadcast(sessionId, event)` pushes to all connected clients. Event types defined in `src/lib/types.ts` as `SSEEventType`.

### Storage (`src/lib/storage/db.ts`)

SQLite via better-sqlite3, file at `dreamheist.db` in project root. WAL mode. Tables: sessions, votes, question_results, agent_runs, artifacts, translation_results, participants, build_state, build_agents, build_events. Lazy-initialized singleton connection.

### Translation (`src/lib/questions.ts`, `src/lib/translation/translate.ts`)

5 symbolic questions (The Mark, The Desire, The Construct, The Distortion, The Rule) each map to concrete product DNA via `TRANSLATION_MAP`. Winners are combined into a formula string like: "For the restless, create a guide that delivers clarity, distinguished by its ability to predict, while ensuring the experience feels instant."

## Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

## Environment

- `ANTHROPIC_API_KEY` — enables live Claude API calls for the agent pipeline. Without it, fallback outputs are used.
- `better-sqlite3` is listed in `serverExternalPackages` in next.config.ts (required for native module).
