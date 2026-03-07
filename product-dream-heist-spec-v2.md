# Product Dream Heist
## Functional Spec for an Interactive Inception-Themed GenAI Demo Site
## Revised Spec v2

## 1. Purpose
Build a web application that lets a live audience vote on a sequence of mysterious, Inception-inspired poll questions from their phones, then lets an admin trigger an orchestration flow that:

1. gathers the winning poll results
2. translates those abstract results into a concrete product brief
3. breaks the brief into role-based agent tasks
4. shows visible progress as those agents work
5. writes prompt artifacts to a project directory
6. outputs a final build package that can be sent into Claude Code

The system should feel cinematic, mysterious, and interactive. It should not try to directly control Claude Code UI in V1. Version 1 should focus on:

- live audience polling
- admin orchestration
- visible agent workflow simulation or execution
- deterministic prompt artifact generation
- a compelling visual experience for a live presentation

---

## 2. Product Vision
This app is a live demo engine for showing how ambiguous human input can be translated into structured, agentic software creation.

The audience experiences a mysterious "dream heist." They vote on abstract questions without fully knowing the end result. The app then reveals the resulting symbolic product DNA, converts it into a concrete brief, and shows a team of agents transforming that brief into a build-ready implementation package.

The experience should communicate:

- participation
- mystery
- transformation of ambiguity into structure
- role-based agent orchestration
- visible progress and traceability

---

## 3. Primary User Roles

### 3.1 Audience Participant
Uses phone to:
- join a live session
- answer one poll question at a time
- see current question and available answers
- receive confirmation that vote was received
- see a waiting / hold screen between rounds
- see a post-vote state during extraction/orchestration

No account or authentication required.

### 3.2 Presenter / Admin
Uses hidden or unlinked admin area to:
- create and start a session
- advance to the next poll question
- lock voting for a question
- view live vote counts
- reveal the winning choice
- trigger the dream translation flow
- trigger agent orchestration
- view progress and artifacts
- copy or export the final Claude Code prompt package
- write prompt files to disk
- reset a session for rehearsal or rerun
- override tie-breaks when desired

No formal auth required in V1. Admin path can be obscure but direct.

### 3.3 Observer Screen
A projector-friendly screen for the room that shows:
- current poll question
- QR code and join instructions
- response count
- winning choices
- extraction stage
- agent progress visualization
- final product brief
- final prompt package summary

---

## 4. High-Level Experience Flow

### Phase 1: Session Setup
Admin opens the hidden admin screen and creates a session.
System generates:
- session ID
- audience join URL
- QR code
- projector URL
- visualization URL

### Phase 2: Live Polling
Admin advances through 5 dream-layer questions:
- The Mark
- The Desire
- The Construct
- The Distortion
- The Rule

Audience votes on phones.
Admin watches responses arrive in real time.
Admin locks the poll and reveals the winning answer.

### Phase 3: Extraction
After all 5 questions are complete, admin clicks **Begin Extraction**.
System:
- gathers winning choices
- maps abstract choices into product DNA
- shows the reveal sequence
- creates a structured translation prompt
- runs the Extractor flow

### Phase 4: Agent Orchestration
System displays agent roles and progress.
Each visible agent receives a defined subtask.
As each completes, the UI updates with:
- status
- output preview
- dependencies
- completion events
- artifact generation

### Phase 5: Final Package
System assembles outputs into a final package for Claude Code.
Admin can:
- copy full prompt package
- copy individual agent prompts
- export markdown and JSON
- open the separate visualization route
- regenerate artifacts from saved session state

---

## 5. Core Product Decision: What Does "Send to the Agents" Mean?
For V1, do not depend on deep direct integration with Claude Code internals.

### Primary Strategy
The app writes per-agent prompt files and final package files to a project directory. Claude Code consumes those artifacts manually or semi-manually.

### Supported Modes
#### Mode A: Manual Prompt Handoff
The app generates:
- one master orchestration prompt
- sub-prompts for each agent role
- a recommended execution order

Admin copies these into Claude Code manually.

#### Mode B: Semi-Automated Local Handoff
The app writes prompt files to a workspace folder, for example:
- `/artifacts/session-<sessionId>/extractor.md`
- `/artifacts/session-<sessionId>/forger.md`
- `/artifacts/session-<sessionId>/architect.md`
- `/artifacts/session-<sessionId>/builder.md`
- `/artifacts/session-<sessionId>/auditor.md`
- `/artifacts/session-<sessionId>/master.md`
- `/artifacts/session-<sessionId>/spec-to-build.md`
- `/artifacts/session-<sessionId>/task-list.md`
- `/artifacts/session-<sessionId>/summary.json`

This is the recommended V1 approach.

### Recommendation
Build V1 around Mode B with Mode A fallback.

---

## 6. LLM Strategy for Demo Day
V1 should use a **hybrid live strategy**.

### Primary
- call Claude live for extraction and agent outputs
- stream responses when feasible so the UI feels alive

### Fallback
- if the live call fails, times out, or is disabled, fall back to pre-seeded outputs or cached deterministic outputs based on the session result

### Requirements
- the UI must not hang on slow model responses
- each agent stage must have a timeout
- each agent stage must expose an error state and fallback path
- the admin should be able to rerun or continue with fallback

---

## 7. Recommended Agent Model
The system should not let agent responsibilities emerge randomly. Define the visible roles ahead of time.

### 7.1 Extractor
Purpose:
Translate symbolic dream-layer results into a concrete product brief.

Output:
- product concept
- target user
- user story
- 3 core features
- MVP scope
- visual direction

### 7.2 Forger
Purpose:
Create naming, tagline, positioning, and thematic polish.

Output:
- product name
- tagline
- short pitch
- tone / brand direction

### 7.3 Architect
Purpose:
Turn the concept into technical and UX structure.

Output:
- recommended stack
- information architecture
- primary screens
- data model sketch
- implementation plan

### 7.4 Builder
Purpose:
Convert the product brief into a build-ready prototype package.

Output:
- final Claude Code build prompt
- `spec-to-build.md`
- `task-list.md`
- file structure suggestion
- MVP implementation checklist

### 7.5 Auditor
Purpose:
Critique the concept and verify it still matches the dream rules.

Output:
- quality risks
- scope cuts
- verification checklist
- merge / no-merge summary

### Internal System Step: Compilation
The system compiles all outputs into the final artifact package.
This is not a visible creative agent in V1.

---

## 8. Agent Pipeline and Dependency Flow
Do not rely on freeform agent assignment. Use a fixed pipeline with dependencies.

### Pipeline
1. Extractor starts first
2. Forger and Architect start after Extractor completes
3. Builder starts after Architect completes, with Forger outputs available as optional brand flavor
4. Auditor starts after Builder completes
5. System compilation assembles the final package

### Execution Model
For V1, this can be a simple async orchestration flow:
- run Extractor
- run Forger and Architect in parallel
- run Builder
- run Auditor
- compile final artifacts

### Hybrid Timing Rule
- actual dependency order must be real
- visible progress pacing may be slightly dramatized for presentation clarity
- progress should never imply a dependency that does not actually exist

---

## 9. Shared Agent Status Model
Use one shared status model across the main app and visualization route.

Statuses:
- idle
- queued
- active
- blocked
- completed
- warning
- failed

Each visible agent card should show:
- role name
- icon or motif
- current task title
- short status message
- dependency badges if relevant
- output excerpt
- elapsed time

---

## 10. Translation System: How Abstract Votes Become Buildable Inputs
The dream answers are symbolic inputs into a translation layer.

### Example Mapping Structure

#### The Mark
Defines user psychology.
- The restless -> speed, motion, efficiency, forward movement
- The ambitious -> status, optimization, performance, recognition
- The overwhelmed -> triage, simplification, prioritization, relief
- The curious -> discovery, experimentation, exploration, novelty
- The skeptical -> proof, trust, verification, confidence
- The unseen -> visibility, recognition, surfacing hidden value

#### The Desire
Defines product promise.
- Clarity -> reduce confusion, sharpen signal
- Control -> improve agency and decisions
- Momentum -> reveal progress and next steps
- Recognition -> surface value and achievement
- Escape -> provide relief or alternate perspective
- Certainty -> reduce ambiguity and risk

#### The Construct
Defines interface model.
- A window -> dashboard / lens / visibility surface
- A guide -> assistant / recommender / step-by-step flow
- A map -> navigator / relationship graph / dependency explorer
- A game -> scoring, challenge, simulation, progression
- A mirror -> profile, reflection, interpretation, self-model
- A signal -> score, alert, confidence engine, distilled output

#### The Distortion
Defines signature capability.
- It predicts -> forecasting / next-best action / risk anticipation
- It remembers -> history / context / memory timeline
- It judges -> ranking / scoring / evaluation
- It reframes -> alternate interpretation / perspective shifting
- It reveals -> hidden patterns / latent relationships / insight surfacing
- It rewinds -> replay / timeline / causality inspection

#### The Rule
Defines UX constraint.
- It must feel instant -> low friction, immediate payoff
- It must feel inevitable -> elegant, coherent, obvious in hindsight
- It must feel simple -> minimal, understandable, low cognitive load
- It must feel alive -> dynamic, reactive, immersive
- It must feel trustworthy -> grounded, traceable, explainable
- It must feel dangerous -> edgy, provocative, dramatic

### Translation Formula
For [user psychology], create a [interface model] that delivers [product promise], distinguished by [signature capability], while ensuring the experience feels [UX constraint].

Then the Extractor expands that into a concrete prototype brief.

---

## 11. Poll Questions and Answer Set

### The Mark
**Whose mind are we entering?**
- The restless
- The ambitious
- The overwhelmed
- The curious
- The skeptical
- The unseen

### The Desire
**What are they truly chasing?**
- Clarity
- Control
- Momentum
- Recognition
- Escape
- Certainty

### The Construct
**What form does the dream take?**
- A window
- A guide
- A map
- A game
- A mirror
- A signal

### The Distortion
**What impossible property bends the dream?**
- It predicts
- It remembers
- It judges
- It reframes
- It reveals
- It rewinds

### The Rule
**What law of the dream cannot be broken?**
- It must feel instant
- It must feel inevitable
- It must feel simple
- It must feel alive
- It must feel trustworthy
- It must feel dangerous

---

## 12. Reveal Sequence
The reveal moment is a first-class product behavior and should be explicitly designed.

### Beat 1: Symbolic Recall
After the final poll closes, show the five winning dream inputs as raw symbolic results, for example:
- The Curious
- Control
- A Map
- It Reveals
- It Must Feel Alive

This validates the audience’s votes.

### Beat 2: Translation Formula
Transform the raw results into the translation sentence:
"For the curious, create a map that delivers control, distinguished by its ability to reveal hidden patterns, while ensuring the experience feels alive."

This is the moment of comprehension.

### Beat 3: Concrete Extraction
The Extractor then produces the plain-English product brief and prototype concept.
This is the moment where abstraction becomes buildable structure.

The reveal should feel clear and cinematic, but not overly long or blocking.

---

## 13. Screens and Routes

### 13.1 Audience Join Screen
Route example: `/join/:sessionId`

Requirements:
- mobile-first
- session title
- short thematic intro
- current question text
- answer buttons
- vote confirmation
- waiting state after voting
- auto-updates when admin advances question

### 13.2 Projector Screen
Route example: `/present/:sessionId`

Requirements:
- big typography
- QR code display
- current question and answers
- live response count
- reveal sequence
- extraction phase visuals
- agent workflow summary
- final output reveal
- graceful error states

### 13.3 Admin Screen
Route example: `/backdoor/control/:sessionId`

Requirements:
- create session
- start / stop session
- advance question
- lock / unlock voting
- reveal winner
- trigger extraction
- trigger orchestration
- see logs and outputs
- copy prompts
- export markdown or JSON
- write prompt files to disk
- reset session
- tie override
- rerun agent step or continue with fallback

### 13.4 Agent Workflow Screen
Route example: `/ops/:sessionId`

Requirements:
- waterfall or board view of agents
- animated status transitions
- prompt previews
- outputs per role
- final compiled package

### 13.5 Visualization Experience
Route example: `/dream-lab/:sessionId`

Purpose:
A more cinematic Inception-inspired experience showing agents working in a stylized way while real outputs stream in.

---

## 14. Participant Identity and Voting Rules
No account system is required, but the app must prevent casual ballot stuffing.

### Participant Identity
- generate a UUID when a participant first joins
- store it in localStorage
- attach it to all vote submissions for that browser

### Voting Rules
- one vote per participant per question
- participants may change their vote until the poll is locked
- once locked, the latest valid vote is final
- server is the source of truth

---

## 15. Tie-Breaking Rules
If two or more options tie for first place:
- the admin UI must surface the tie clearly
- default behavior is random selection among tied options
- admin has an optional override before reveal
- final chosen winner is persisted as the official result

---

## 16. Phone Post-Vote Experience
The phone should not become a dead screen.

### During a Question
- show current layer name
- show question prompt
- show answer options
- show response confirmation after vote

### After Voting on a Question
- show confirmation state
- show that the participant can wait for the next layer
- optionally show response count or hold state

### After All Polling Is Complete
- show the symbolic result summary
- show "dream complete, watch the main screen"

### During Extraction / Orchestration
- show simplified progress updates
- show current stage, for example: "Extracting concept", "Forging identity", "Designing structure"

### When Complete
- show final product concept summary and short tagline

---

## 17. Session Lifecycle
The session must have explicit states to avoid race conditions and invalid actions.

States:
- `created`
- `polling`
- `revealing`
- `extracting`
- `orchestrating`
- `complete`
- `error`

Rules:
- admin-triggered transitions only, except vote submissions during `polling`
- UI actions must be constrained by session state
- screens should render based on current session state, not local assumptions

---

## 18. Real-Time Architecture Recommendation
Use **SSE for broadcast updates** and normal HTTP POST routes for mutations.

### Event Flow
- Admin action -> API route -> mutate server state -> emit SSE event -> all subscribed clients update
- Phone vote -> API route -> mutate server state -> emit SSE event -> projector/admin/phone update

### Why SSE
- simpler than WebSockets for V1
- enough for server-to-client broadcast
- easier to debug
- works well with the needed communication pattern

### Source of Truth
Use a single server-side session store such as SQLite or local persisted JSON.
Clients should subscribe and render from server-emitted state updates.

---

## 19. Real-Time Event Catalog
Define the event protocol explicitly.

### Required Events
- `session_state_changed`: `{ sessionId, state }`
- `question_advanced`: `{ sessionId, questionIndex, questionKey }`
- `vote_cast`: `{ sessionId, questionId, voteCount }`
- `voting_locked`: `{ sessionId, questionId }`
- `winner_revealed`: `{ sessionId, questionId, winnerId, winnerLabel }`
- `reveal_started`: `{ sessionId }`
- `extraction_started`: `{ sessionId }`
- `agent_status_changed`: `{ sessionId, role, status, message }`
- `artifact_generated`: `{ sessionId, role, artifactType, snippet, filePath? }`
- `pipeline_complete`: `{ sessionId }`
- `error_occurred`: `{ sessionId, scope, message }`

### Consumers
- audience phone listens to session/question/progress events
- projector listens to all public presentation events
- admin listens to all events plus admin-only detail state
- visualization route listens to all orchestration and artifact events

---

## 20. Prompt File Strategy
Prompt files should be written to a project directory and be regeneratable from session state at any time.

### Suggested Output Directory
`./artifacts/session-<sessionId>/`

### Files
- `extractor.md`
- `forger.md`
- `architect.md`
- `builder.md`
- `auditor.md`
- `master.md`
- `spec-to-build.md`
- `task-list.md`
- `summary.json`

### Requirements
- file generation must be deterministic from saved session state
- files must be easy to regenerate after restart or failure
- overwriting is acceptable in V1
- app should expose file paths in admin UI
- app should support copy buttons in addition to file writing

---

## 21. Output Artifacts
The system should generate and persist:

### 21.1 Session Artifact
- full question results
- winning answers
- timestamps
- audience counts

### 21.2 Translation Artifact
- symbolic inputs
- mapped meanings
- product translation summary

### 21.3 Agent Artifacts
Per agent:
- input context
- output text
- status
- timing
- file path of written prompt artifact if applicable

### 21.4 Final Prompt Package
Includes:
- product brief
- brand direction
- architecture summary
- final build prompt for Claude Code
- `spec-to-build.md`
- `task-list.md`
- verification checklist

### Export Formats
- Markdown
- JSON
- copy-to-clipboard blocks

---

## 22. Failure Modes and Fallbacks

| Failure | Impact | Fallback |
|---|---|---|
| WiFi down or audience cannot join | No phone voting | Presenter uses admin controls to collect show-of-hands results manually |
| SSE disconnect | Stale screen | Auto-reconnect and fetch latest full state snapshot |
| Tie vote | No clear winner | Random tiebreak with presenter override |
| Zero votes on a question | Awkward stall | Admin can inject a default vote or reopen briefly |
| Claude timeout or API failure | No live generated output | Switch to fallback seeded output |
| Artifact write failure | Files missing | Keep outputs in memory/server store and allow retry |
| Browser refresh mid-session | Temporary local state loss | Rehydrate entirely from server state |
| Agent stage fails | Broken pipeline | Show error state, allow rerun or continue with fallback |

---

## 23. Prompt Template Example
Include at least one fully worked example in the implementation.

### Example Winning Inputs
- The Mark: The Curious
- The Desire: Control
- The Construct: A Map
- The Distortion: It Reveals
- The Rule: It Must Feel Alive

### Example Translation Formula
For the curious, create a map that delivers control, distinguished by its ability to reveal hidden patterns, while ensuring the experience feels alive.

### Example Extractor Goal
Translate the symbolic result into a lightweight web prototype concept such as:
- a visual decision navigator
- a dependency explorer
- an interactive map of options and consequences

### Example Expected Package Shape
- Extractor creates product brief
- Forger creates name and tagline
- Architect creates screen plan and implementation outline
- Builder creates final Claude prompt plus `spec-to-build.md` and `task-list.md`
- Auditor validates dream-rule alignment and scope

This example should become a concrete implementation test case.

---

## 24. Technical Architecture Recommendation

### Frontend
- Next.js preferred
- Tailwind for styling
- shadcn/ui or clean custom components
- lightweight animation library for transitions

### Backend
- Next.js API routes or route handlers
- SQLite or low-complexity persisted storage
- route to write prompt artifacts to disk
- SSE endpoint for live updates

### Recommended File Structure
/app
  /join/[sessionId]
  /present/[sessionId]
  /dream-lab/[sessionId]
  /backdoor/control/[sessionId]
/api
  /session
  /vote
  /orchestrate
  /artifacts
  /events/[sessionId]
/lib
  /agents
  /translation
  /realtime
  /storage
/artifacts

---

## 25. State Model

### Session
- id
- createdAt
- title
- state
- currentQuestionIndex
- votingLocked
- revealState
- audienceCount

### Question
- id
- key
- label
- prompt
- options[]
- status

### Vote
- sessionId
- questionId
- participantId
- selectedOptionId
- timestamp

### AgentRun
- id
- sessionId
- role
- status
- startedAt
- completedAt
- input
- output
- logs[]

### FinalArtifact
- sessionId
- winningAnswers
- translatedBrief
- agentOutputs
- masterPrompt
- exportedFiles

---

## 26. MVP Scope
The MVP should include:
- create session
- phone voting with QR join
- 5-question flow
- admin controls
- projector screen
- result aggregation
- translation layer
- reveal sequence
- predefined agent pipeline
- per-agent progress states
- prompt file generation
- final prompt generation
- copy/export final prompt package
- session reset / rehearsal support
- graceful fallback states

Do not include initially:
- user auth
- persistent user accounts
- direct Claude Code UI integration
- complex multi-session analytics
- custom user-defined agent roles
- advanced totem motion systems

---

## 27. Resolved Design Defaults
These are the defaults assumed for implementation unless changed later.

### 27.1 Agent Execution Model
- The app writes per-agent prompt files to a project directory
- The app compiles a master orchestration prompt
- The app generates `spec-to-build.md` and `task-list.md`
- The app does not directly control Claude Code UI in V1
- The app supports a hybrid execution model with live Claude plus fallback

### 27.2 Visualization Model
- Visualization is defined in a separate spec file
- V1 uses clear agent cards with states and dependency lines or waterfall flow
- Future versions may add abstract totem-like motion between layers
- Totems are symbolic dream objects, not humanoid characters
- Cards remain the authoritative information layer

### 27.3 Admin Access
- No authentication required in V1
- Admin screens can be obscured by route naming only

### 27.4 Build Constraints
- Single full-stack app preferred
- Real-time updates required between audience, admin, projector, and visualization views
- Prompt artifacts must be exportable as markdown and writable to disk

---

## 28. Success Criteria
A successful MVP allows you to:
- run a live audience vote from phones
- reveal a coherent, surprising product concept
- show a cinematic, understandable multi-agent workflow
- produce a Claude Code-ready build prompt in minutes
- write prompt artifacts to disk reliably
- make the audience feel they collectively invented the product

---

## 29. Build Notes for Claude Code
When using this spec with Claude Code, instruct it to:
- prioritize end-to-end demoability over production hardening
- prefer a clean single-app architecture
- use SSE plus POST routes
- implement deterministic artifact generation
- use mocked or fallback agent execution when live LLM calls fail
- keep cards as the default agent visualization
- make the UI feel cinematic but still readable and practical
