# Dream Heist

Interactive Inception-themed demo that transforms live audience votes into a buildable product concept via an agent pipeline.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000 to create a session.

## Routes

| Route | Purpose |
|---|---|
| `/` | Create new session |
| `/join/[sessionId]` | Audience phone voting |
| `/present/[sessionId]` | Projector display |
| `/dream-lab/[sessionId]` | Agent visualization |
| `/backdoor/control/[sessionId]` | Admin controls |

## Flow

1. Create session from home page (sends you to admin)
2. Share QR code / join URL with audience
3. Advance through 5 dream-layer questions
4. Lock voting, reveal winners
5. After all 5: Begin Reveal -> Run Extraction -> Start Orchestration
6. Watch agents work (Extractor -> Forger+Architect -> Builder -> Auditor)
7. Write artifacts to disk or copy prompts

## Agent Execution

By default, agents use deterministic fallback outputs. To use live Claude:

```bash
export ANTHROPIC_API_KEY=your-key-here
npm run dev
```

The system auto-detects the API key and switches to live mode with fallback on failure.

## Artifacts

Written to `./artifacts/session-<sessionId>/`:
- `extractor.md`, `forger.md`, `architect.md`, `builder.md`, `auditor.md`
- `master.md` (combined build prompt)
- `spec-to-build.md`, `task-list.md`
- `summary.json`, `translation.json`

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS
- SQLite (better-sqlite3)
- SSE for real-time updates
