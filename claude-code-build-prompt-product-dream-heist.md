# Claude Code Build Prompt
## Product Dream Heist Implementation Prompt

You are building a full-stack Next.js application called **Product Dream Heist**.

This is an internal live demo tool for an interactive presentation about GenAI and agentic AI.

## What this app does
A live audience scans a QR code and votes on 5 cryptic, dream-themed poll questions from their phones. Their answers generate symbolic product DNA. The app then reveals the result, translates it into a concrete product brief, runs a fixed agent pipeline, visualizes the agents working, and writes prompt artifacts to a local project directory for Claude Code consumption.

This is not a consumer app. It is a presentation/demo system that needs to feel polished, clever, and reliable in a room full of skeptical engineers.

## Read these specs as the source of truth
You should implement from these two specs:

1. `product-dream-heist-spec-v2.md`
2. `product-dream-heist-visualization-spec-v2.md`

Treat the main spec as the primary product/architecture source of truth and the visualization spec as the source of truth for the dream-lab route.

## Implementation priorities
Prioritize in this order:
1. end-to-end demoability
2. correctness of state and orchestration flow
3. projector legibility and phone usability
4. deterministic artifact generation
5. cinematic polish

Do not over-engineer.

## Core technical decisions
Use these defaults:
- Next.js App Router
- TypeScript
- Tailwind CSS
- simple clean components, shadcn/ui if helpful
- SQLite or lightweight persisted storage
- SSE for realtime server-to-client updates
- HTTP POST routes for mutations
- local artifact writing to `./artifacts/session-<sessionId>/`
- one codebase with separate routes for phone, presenter, and visualization

## Required routes
Build these routes:
- `/join/[sessionId]`
- `/present/[sessionId]`
- `/dream-lab/[sessionId]`
- `/backdoor/control/[sessionId]`

## Required backend capabilities
Build server logic for:
- session creation/reset
- question progression
- vote submission with one-vote-per-participant-per-question
- localStorage participant UUID behavior on client
- tie detection and default random tiebreak with admin override
- session lifecycle state machine
- SSE event stream per session
- orchestration pipeline
- artifact generation and writing to disk
- rerun/fallback behavior for failed agent stages

## Agent pipeline
Implement exactly this visible pipeline:
1. Extractor
2. Forger + Architect in parallel
3. Builder
4. Auditor
5. internal final compilation

Do not expose a Director agent card.

## Realtime model
Use SSE with:
- initial state snapshot fetch
- incremental event updates
- reconnect-safe client behavior

Implement the event catalog defined in the main spec.

## LLM / agent execution strategy
Implement the pipeline with a pluggable runner:
- primary mode: live Claude-compatible runner abstraction
- fallback mode: deterministic mocked/seeded outputs

Important:
- build the abstraction cleanly
- but ship with a robust fallback so the app works even without live model access
- UI should visibly support hybrid timing with real dependency order and lightly dramatized pacing

## Artifact generation
The system must generate and write:
- `extractor.md`
- `forger.md`
- `architect.md`
- `builder.md`
- `auditor.md`
- `master.md`
- `spec-to-build.md`
- `task-list.md`
- `summary.json`

Artifact generation must be deterministic from saved session state and regeneratable after restart.

## UI requirements
### Phone
- mobile-first
- current question
- vote buttons
- confirmation state
- post-vote hold state
- post-poll summary / progress state

### Projector
- large readable layout
- QR code
- response count
- reveal sequence
- clean progress presentation
- graceful error states

### Admin
- obvious next actions
- current session state
- vote counts
- tie handling
- extraction/orchestration controls
- prompt copy/export
- artifact write controls
- session reset

### Dream-lab
- waterfall agent layout
- cards as authoritative info layer
- event log
- artifact rail
- projector-safe styling
- architecture that can later support abstract totem motion

## Reveal sequence
Implement the 3-beat reveal from the spec:
1. symbolic recall
2. translation formula
3. concrete extraction

## Important constraints
- no auth in V1
- no direct Claude Code UI automation
- no complex analytics
- no user-defined agents
- no 3D visualization systems
- no free-form graph dependency layout for V1

## What to produce
Build the app in a clean, runnable state.

Also produce:
- concise README with setup/run instructions
- seeded development data or easy local flow
- a clear place to configure live-vs-fallback agent execution
- sensible comments around the orchestration and SSE parts

## Implementation approach
Start by:
1. defining data models and session lifecycle
2. implementing storage and SSE transport
3. implementing core routes and admin flow
4. implementing voting and reveal
5. implementing orchestration pipeline
6. implementing artifact generation
7. implementing dream-lab visualization
8. polishing UI

## Output expectations
Do not just sketch the architecture.
Actually build the application.

When making decisions not explicitly covered by the specs:
- prefer simple
- prefer reliable
- prefer readable
- prefer demo-friendly

After reading the specs, begin implementation.
