# Product Dream Heist
## Visualization Mode Spec
### Inception-Inspired Agent Experience for the Dream-Lab Route
### Revised Spec v2

## 1. Purpose
Define a separate visualization-focused spec for the cinematic agent experience used after polling is complete and the orchestration flow begins.

This mode exists to make the invisible work of agents feel tangible, theatrical, and legible during a live presentation.

The visualization should:
- make agent roles feel alive
- show task routing and dependencies
- communicate progress clearly to a room
- preserve the dream-heist theme
- support future evolution from simple cards to abstract totem motion across dream layers

Suggested route:
`/dream-lab/:sessionId`

---

## 2. Visualization Goals
The visualization should balance two things:

### 2.1 Clarity
The audience must always understand:
- which agents exist
- what each one is doing
- what stage the system is in
- what outputs have been produced
- what remains to be done

### 2.2 Spectacle
The screen should feel special enough to justify being part of a live demo:
- cinematic
- mysterious
- layered
- animated
- memorable

The visualization should never become so abstract that the room loses track of the actual workflow.

---

## 3. Experience Modes
Design the route so it can support multiple visualization modes over time.

### Mode A: Operations Board
Default V1.
- agent cards
- waterfall or structured dependency layout
- status pulses
- output previews

### Mode C: Hybrid Totem Layer
Future mode.
- cards remain the primary information surface
- abstract totems act as ambient motion and connection layer
- totems move between fixed stations or layers as tasks activate

### Recommendation
Build Mode A first, but architect the UI so it can evolve into Mode C.

Do not plan for a pure avatar-only mode where cards disappear.

---

## 4. Core Visual Metaphor
The product being created sits near the top or center as the "dream core," but during orchestration the active agent flow should dominate attention.

Around it are:
- agent stations
- subtle dream layers
- connection paths
- status pulses
- extracted artifacts

This route should feel like a cross between:
- a mission control board
- an architectural model
- a heist planning room
- a surreal dream machine

Avoid direct movie mimicry.
Use original design language inspired by layered reality, architecture, and coordinated infiltration.

---

## 5. Visual Models to Support

## 5.1 V1 Model: Waterfall Heist Board
This is the initial implementation.

### Layout
- top summary band: extracted product concept, small and secondary while agents are active
- main center: waterfall agent layout
  - Extractor
  - Forger and Architect side by side
  - Builder
  - Auditor
- side rail: artifact previews
- bottom rail: event log

### Why It Works
- easy to understand in a room
- clearer than a free-form graph
- dependency flow is visually obvious
- easy to evolve later

## 5.2 Future Model: Totems Moving Between Fixed Stations
This is the bigger vision.

### Concept
Each agent gains an abstract totem or sigil.
Dream layers are represented as fixed stations, rings, corridors, or chambers.
When a stage begins, the corresponding totem moves along a persistent path between fixed locations.

Examples:
- Extractor moves to the translation station
- Forger moves to the identity forge
- Architect moves to the blueprint deck
- Builder moves to the construction deck
- Auditor circles the audit ring

### Important Constraint
The spatial model must remain fixed throughout the entire run.
Stations cannot rearrange themselves.

### Recommendation
Totems should enhance understanding, not replace the card layer.
Treat cards as authoritative and totems as an ambient motion layer.

---

## 6. Design Principles

### 6.1 Legibility First
Even in cinematic mode:
- text must be readable from a room
- statuses must be obvious
- motion should support comprehension, not distract from it

### 6.2 One Primary Focal Point
At any moment, the viewer should know where to look:
- active agent
- freshly completed artifact
- final reveal

### 6.3 Motion with Meaning
All animation should imply state change:
- task assigned
- dependency unlocked
- prompt generated
- artifact compiled
- stage completed

### 6.4 Depth Without Noise
Use:
- layered panels
- light parallax
- glow pulses
- subtle line drawing animation

Do not use:
- excessive particles
- chaotic camera movement
- unreadable overlays
- decorative motion unrelated to state

---

## 7. Shared Agent Presentation Model
This route must use the same role definitions and status model as the main spec.

### Visible Roles
- Extractor
- Forger
- Architect
- Builder
- Auditor

### Suggested Totem / Motif Direction
- Extractor: prism / lens
- Forger: seal / sigil
- Architect: frame / compass
- Builder: scaffold / cube
- Auditor: eye / checkpoint

Totems should be abstract geometric dream objects, not humanoid figures.

### Status States
- idle
- queued
- active
- blocked
- completed
- warning
- failed

---

## 8. Data and Transport
The visualization route should consume the same server-originated state and events as the rest of the application.

### Transport
- subscribe to the same SSE event stream as projector and phone views
- fetch an initial full state snapshot on load
- reconcile incoming events against server state

### Key Event Types Used Here
- `session_state_changed`
- `reveal_started`
- `extraction_started`
- `agent_status_changed`
- `artifact_generated`
- `pipeline_complete`
- `error_occurred`

---

## 9. Screen Architecture

### 9.1 Top Summary Band
- product name or placeholder
- short concept line
- current stage
- session status

During active orchestration, this remains visible but secondary.

### 9.2 Main Waterfall Board
- Extractor at top
- Forger and Architect side by side beneath
- Builder beneath them
- Auditor at bottom
- subtle connectors or flow cues between stages

### 9.3 Artifact Rail
- product brief
- naming result
- architecture result
- builder prompt
- audit summary
- final package

### 9.4 Event Log
- concise streaming updates
- projector-friendly
- latest event visually emphasized

---

## 10. Stage-Based Presentation
The visualization should follow a staged arc.

### Stage 1: Symbolic Reveal
Dream inputs have been selected and are shown in raw form.

### Stage 2: Translation
Translation sentence is shown and Extractor activates.

### Stage 3: Branching
Extractor completes.
Forger and Architect activate.

### Stage 4: Construction
Builder activates after Architect.

### Stage 5: Audit
Auditor reviews the package.

### Stage 6: Convergence
Final artifacts compile and the completed package is revealed.

---

## 11. Animation Model

### V1 Safe Animations
- line draw-in for stage connections
- card elevation when active
- soft glow pulse for active status
- artifact slide-in
- small ring or ambient background motion
- reveal fade/transform between stages

### Future Totem Animations
- totem movement between fixed stations
- pulse trails between stations
- convergence toward final package reveal

### Constraints
- motion must be slow enough to follow
- motion must not block reading
- the card layer remains primary

---

## 12. MVP Scope for This Visualization Spec
Include now:
- dream-lab route
- top summary band
- waterfall agent layout
- per-agent cards
- shared status model
- event log
- artifact previews
- stage transitions
- projector-safe styling
- hooks for future totem layer

Do not include yet:
- full totem travel system
- complex scene camera systems
- 3D environments
- audio-dependent behavior

---

## 13. Success Criteria
This visualization is successful if:
- the room can understand the workflow without explanation
- the active agent is obvious at a glance
- it feels cinematic and memorable
- it does not compromise readability
- it leaves a clean path to future totem motion

---

## 14. Build Notes for Claude Code
When implementing this route:
- optimize for projector legibility first
- use cards as the default representation
- use a waterfall layout, not a free-form graph
- leave extension points for future totem motion between fixed stations
- keep the aesthetic original, cinematic, and restrained
