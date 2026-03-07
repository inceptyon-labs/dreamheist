export default function ExplainerPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] text-gray-200 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#0d0e14]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Dream Heist</h1>
            <p className="text-sm text-gray-500 mt-0.5">How it works</p>
          </div>
          <div className="text-xs text-gray-600 font-mono">Inception-themed GenAI demo</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* Intro */}
        <section className="max-w-3xl">
          <p className="text-lg text-gray-300 leading-relaxed">
            You vote on your phones. Your votes define a product. AI agents design it, spec it, and build it live -- all in about 10 minutes.
          </p>
          <p className="text-sm text-gray-500 mt-3">
            Every run produces a completely different product. The agents are creative, not scripted.
          </p>
        </section>

        {/* Phase 1: Voting */}
        <section>
          <PhaseHeader number={1} title="The Audience Votes" subtitle="~2 minutes" />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-400 leading-relaxed">
                Scan the QR code on screen. You get 5 questions -- each one defines a dimension of the product we are about to build.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                The questions use symbolic, Inception-themed language. Behind the scenes, each answer maps to concrete product DNA.
              </p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 space-y-3">
              <div className="text-[10px] text-gray-600 uppercase tracking-wider font-bold mb-3">What your votes actually define</div>
              <DimensionRow label="Target Audience" example="power users who optimize everything" />
              <DimensionRow label="Core Need" example="clarity, control, momentum" />
              <DimensionRow label="Product Type" example="dashboard, guide, game, mirror" />
              <DimensionRow label="Key Capability" example="predicts, reveals, remembers" />
              <DimensionRow label="UX Principle" example="feels instant, feels alive, feels dangerous" />
            </div>
          </div>
        </section>

        {/* Phase 2: Pipeline */}
        <section>
          <PhaseHeader number={2} title="AI Agents Design the Product" subtitle="~3 minutes" />
          <p className="text-sm text-gray-400 mt-4 mb-6 max-w-2xl leading-relaxed">
            Five AI agents run in sequence. Each one takes the voting results and the output of the previous agents, then produces a specific deliverable. Every agent uses Claude (Sonnet) via the Claude Code CLI.
          </p>

          <div className="space-y-px rounded-xl overflow-hidden border border-gray-800/50">
            <PipelineAgent
              step={1}
              name="Product Analyst"
              parallel="Brand Strategist + Technical Architect"
              output="Product brief, target user profile, core features, MVP scope"
              parallelOutput="Name, tagline, brand voice / Screen designs, data model, tech stack"
              detail="All three run in parallel from the vote results. The Analyst defines what to build, the Strategist names it, the Architect structures it."
            />
            <PipelineAgent
              step={2}
              name="Implementation Lead"
              parallel="Quality Reviewer"
              output="Spec-to-build document, ordered task list, file structure, MVP checklist"
              parallelOutput="Risk assessment, scope cuts, verification checklist, ship/no-ship verdict"
              detail="Both run in parallel. The Lead combines all upstream outputs into a buildable spec. The Reviewer critiques the concept against the original requirements."
            />
          </div>
        </section>

        {/* Phase 3: Build */}
        <section>
          <PhaseHeader number={3} title="Agents Build It Live" subtitle="~5 minutes" />
          <p className="text-sm text-gray-400 mt-4 mb-6 max-w-2xl leading-relaxed">
            Six Claude Code processes are spawned. Each agent owns specific files and works within strict boundaries.
            They build a real, working Next.js application from the spec.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <BuildAgent
              role="extractor"
              name="Cobb"
              title="Scaffolding"
              phase="Phase 1 (solo)"
              color="#3b82f6"
              description="Initializes the project with pnpm. Creates folder structure, config files, installs dependencies. Then stops."
            />
            <BuildAgent
              role="architect"
              name="Ariadne"
              title="Pages & Routing"
              phase="Phase 2 (parallel)"
              color="#06b6d4"
              description="Builds all page routes, layouts, navigation. Owns src/app/**/page.tsx."
            />
            <BuildAgent
              role="forger"
              name="Eames"
              title="Components & Design"
              phase="Phase 2 (parallel)"
              color="#a855f7"
              description="Creates reusable UI components, theming, animations. Uses AI image generation for logos and design skills for polish."
            />
            <BuildAgent
              role="builder"
              name="Yusuf"
              title="API & Backend"
              phase="Phase 2 (parallel)"
              color="#22c55e"
              description="Implements API routes, utility functions, data layer. Owns src/app/api/ and src/lib/."
            />
            <BuildAgent
              role="shade"
              name="Mal"
              title="Testing"
              phase="Phase 2 (parallel)"
              color="#ef4444"
              description="Writes tests first, before implementation exists. Keeps running them as other agents build. Defines the contract."
            />
            <BuildAgent
              role="auditor"
              name="Arthur"
              title="Review & Integration"
              phase="Phase 2 (parallel)"
              color="#f97316"
              description="Reviews everything. Fixes bugs, wires up imports, runs the dev server. The last line of defense."
            />
          </div>
        </section>

        {/* Pipeline Diagram */}
        <section>
          <PhaseHeader number={0} title="The Full Pipeline" subtitle="end to end" />
          <div className="mt-8">
            <PipelineDiagram />
          </div>
        </section>

        {/* Tech details */}
        <section className="pb-12">
          <PhaseHeader number={0} title="Under the Hood" subtitle="technical details" />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailCard title="Stack" items={[
              'Next.js App Router + React 19',
              'TypeScript + Tailwind CSS 4',
              'SQLite (better-sqlite3) for state',
              'SSE for real-time updates',
            ]} />
            <DetailCard title="AI" items={[
              'Claude Code CLI (subscription)',
              'Pipeline agents: Sonnet, one-shot',
              'Build agents: mixed models',
              'Eames uses image gen + design skills',
            ]} />
            <DetailCard title="Coordination" items={[
              'File ownership boundaries per agent',
              'Phase-gated execution (scaffold first)',
              'Arthur reviews across all boundaries',
              'All events persisted + streamed live',
            ]} />
          </div>
        </section>

      </main>
    </div>
  );
}

// --- Totem Icons (matching dream-lab) ---

function TotemIcon({ role, size = 40, color }: { role: string; size?: number; color: string }) {
  const s = size;
  switch (role) {
    case 'extractor':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <rect x="29" y="8" width="6" height="12" rx="2" fill={color} />
          <path d="M16 28 L48 28 L34 54 Q32 58 30 54 Z" fill={color} opacity={0.85} />
          <ellipse cx="32" cy="28" rx="18" ry="5" fill={color} opacity={0.6} />
          <circle cx="32" cy="55" r="2" fill={color} />
          <ellipse cx="32" cy="28" rx="22" ry="3" fill="none" stroke={color} strokeWidth="0.8" opacity={0.3} strokeDasharray="3 3" />
        </svg>
      );
    case 'auditor':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <rect x="14" y="14" width="36" height="36" rx="6" fill={color} opacity={0.85} />
          <rect x="14" y="14" width="36" height="36" rx="6" fill="none" stroke={color} strokeWidth="2" />
          <circle cx="24" cy="24" r="3" fill="black" opacity={0.5} />
          <circle cx="40" cy="24" r="3" fill="black" opacity={0.5} />
          <circle cx="32" cy="32" r="3" fill="black" opacity={0.5} />
          <circle cx="24" cy="40" r="3" fill="black" opacity={0.5} />
          <circle cx="40" cy="40" r="3" fill="black" opacity={0.5} />
        </svg>
      );
    case 'architect':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <ellipse cx="32" cy="56" rx="14" ry="4" fill={color} opacity={0.7} />
          <rect x="20" y="52" width="24" height="4" rx="2" fill={color} opacity={0.85} />
          <rect x="27" y="30" width="10" height="22" rx="2" fill={color} opacity={0.8} />
          <ellipse cx="32" cy="30" rx="10" ry="3" fill={color} opacity={0.6} />
          <path d="M24 28 Q24 14 32 8 Q40 14 40 28 Z" fill={color} opacity={0.85} />
          <path d="M32 10 L30 22 L34 22 Z" fill="black" opacity={0.3} />
          <circle cx="32" cy="8" r="3" fill={color} />
        </svg>
      );
    case 'forger':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="26" fill={color} opacity={0.2} />
          <circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="3" />
          <circle cx="32" cy="32" r="18" fill="none" stroke={color} strokeWidth="2" opacity={0.7} />
          <circle cx="32" cy="32" r="10" fill={color} opacity={0.5} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 32 + Math.cos(rad) * 20;
            const y1 = 32 + Math.sin(rad) * 20;
            const x2 = 32 + Math.cos(rad) * 26;
            const y2 = 32 + Math.sin(rad) * 26;
            return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="4" strokeLinecap="round" opacity={0.6} />;
          })}
        </svg>
      );
    case 'builder':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <rect x="26" y="6" width="12" height="14" rx="3" fill="none" stroke={color} strokeWidth="2" />
          <rect x="24" y="4" width="16" height="4" rx="2" fill={color} opacity={0.7} />
          <path d="M26 20 L20 38 Q18 48 24 54 L40 54 Q46 48 44 38 L38 20 Z" fill="none" stroke={color} strokeWidth="2" />
          <path d="M22 40 Q20 48 25 52 L39 52 Q44 48 42 40 Z" fill={color} opacity={0.5} />
          <circle cx="30" cy="44" r="2" fill={color} opacity={0.6} />
          <circle cx="36" cy="38" r="1.5" fill={color} opacity={0.4} />
          <circle cx="33" cy="48" r="1" fill={color} opacity={0.5} />
        </svg>
      );
    case 'shade':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <path d="M20 10 L44 10 L34 30 L30 30 Z" fill={color} opacity={0.7} />
          <path d="M20 54 L44 54 L34 34 L30 34 Z" fill={color} opacity={0.7} />
          <rect x="29" y="29" width="6" height="6" fill={color} opacity={0.9} />
          <line x1="18" y1="10" x2="46" y2="10" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <line x1="18" y1="54" x2="46" y2="54" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <line x1="28" y1="16" x2="24" y2="24" stroke={color} strokeWidth="1" opacity={0.4} />
          <line x1="38" y1="42" x2="42" y2="48" stroke={color} strokeWidth="1" opacity={0.4} />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="24" fill={color} opacity={0.3} />
        </svg>
      );
  }
}

// --- Components ---

function PhaseHeader({ number, title, subtitle }: { number: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline gap-4">
      {number > 0 && (
        <div className="text-4xl font-black text-gray-800 tabular-nums">{number}</div>
      )}
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <span className="text-xs text-gray-600 uppercase tracking-wider">{subtitle}</span>
      </div>
    </div>
  );
}

function DimensionRow({ label, example }: { label: string; example: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-xs font-bold text-gray-300 w-32 shrink-0">{label}</span>
      <span className="text-xs text-gray-500">{example}</span>
    </div>
  );
}

function PipelineAgent({ step, name, output, detail, parallel, parallelOutput }: {
  step: number; name: string; output: string; detail: string; parallel?: string; parallelOutput?: string;
}) {
  return (
    <div className="bg-gray-900/30 p-5 flex gap-5">
      <div className="text-2xl font-black text-gray-800 tabular-nums w-8 shrink-0">{step}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-white">{name}</span>
          {parallel && (
            <>
              <span className="text-gray-700 text-xs">+</span>
              <span className="font-bold text-sm text-white">{parallel}</span>
              <span className="text-[10px] text-gray-600 border border-gray-800 rounded px-1.5 py-0.5">parallel</span>
            </>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">{detail}</p>
        <div className="mt-2 text-xs text-gray-400">
          <span className="text-gray-600">Output:</span> {output}
        </div>
        {parallelOutput && (
          <div className="mt-1 text-xs text-gray-400">
            <span className="text-gray-600">Output:</span> {parallelOutput}
          </div>
        )}
      </div>
    </div>
  );
}

function BuildAgent({ role, name, title, phase, color, description }: {
  role: string; name: string; title: string; phase: string; color: string; description: string;
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="shrink-0" style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}>
          <TotemIcon role={role} size={32} color={color} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">{name}</span>
            <span className="text-xs text-gray-500">/ {title}</span>
          </div>
          <div className="text-[10px] text-gray-600 uppercase tracking-wider">{phase}</div>
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function PipelineDiagram() {
  // Layout constants
  const W = 1100, H = 520;
  const nodeH = 36, nodeR = 6;
  const smallNodeH = 28;

  // Node positions: [cx, cy]
  const nodes = {
    votes:      { x: 60,   y: 100, w: 100, label: 'Audience Votes', sub: '5 questions', color: '#8b5cf6' },
    translate:  { x: 60,   y: 190, w: 100, label: 'Translation',    sub: 'votes to product DNA', color: '#6366f1' },
    // Stage 1: all three in parallel
    analyst:    { x: 260,  y: 100, w: 120, label: 'Analyst',        sub: 'product brief', color: '#3b82f6' },
    strategist: { x: 260,  y: 155, w: 120, label: 'Strategist',     sub: 'name + brand', color: '#a855f7' },
    architect:  { x: 260,  y: 210, w: 120, label: 'Architect',      sub: 'screens + stack', color: '#06b6d4' },
    // Stage 2: both in parallel
    builder:    { x: 470,  y: 125, w: 130, label: 'Impl. Lead',     sub: 'spec + tasks', color: '#22c55e' },
    reviewer:   { x: 470,  y: 185, w: 130, label: 'Reviewer',       sub: 'quality gate', color: '#f97316' },
    // Compilation
    master:     { x: 660,  y: 155, w: 110, label: 'Master Prompt',  sub: 'all outputs', color: '#fbbf24' },
    // Build phase
    cobb:       { x: 800,  y: 310, w: 90,  label: 'Cobb',     sub: 'scaffold', color: '#3b82f6' },
    ariadne:    { x: 920,  y: 370, w: 80,  label: 'Ariadne',  sub: 'pages', color: '#06b6d4' },
    eames:      { x: 920,  y: 410, w: 80,  label: 'Eames',    sub: 'components', color: '#a855f7' },
    yusuf:      { x: 920,  y: 450, w: 80,  label: 'Yusuf',    sub: 'API', color: '#22c55e' },
    mal:        { x: 1020, y: 370, w: 80,  label: 'Mal',       sub: 'tests', color: '#ef4444' },
    arthur:     { x: 1020, y: 410, w: 80,  label: 'Arthur',    sub: 'review', color: '#f97316' },
    prototype:  { x: 1020, y: 490, w: 80,  label: 'Prototype', sub: 'working app', color: '#4ade80' },
  };

  type NK = keyof typeof nodes;

  // Connections: [from, to]
  const connections: [NK, NK][] = [
    ['votes', 'translate'],
    // Stage 1: translation feeds all three in parallel
    ['translate', 'analyst'],
    ['translate', 'strategist'],
    ['translate', 'architect'],
    // Stage 2: all three feed both builder and reviewer
    ['analyst', 'builder'], ['strategist', 'builder'], ['architect', 'builder'],
    ['analyst', 'reviewer'], ['architect', 'reviewer'],
    // Compilation
    ['builder', 'master'], ['reviewer', 'master'],
    // Build phase
    ['master', 'cobb'],
    ['cobb', 'ariadne'], ['cobb', 'eames'], ['cobb', 'yusuf'], ['cobb', 'mal'], ['cobb', 'arthur'],
    ['ariadne', 'prototype'], ['eames', 'prototype'], ['yusuf', 'prototype'], ['mal', 'prototype'], ['arthur', 'prototype'],
  ];

  function nodeRight(k: NK) { return nodes[k].x + nodes[k].w / 2; }
  function nodeLeft(k: NK) { return nodes[k].x - nodes[k].w / 2; }
  function nodeBot(k: NK) { return nodes[k].y + nodeH / 2; }
  function nodeTop(k: NK) { return nodes[k].y - nodeH / 2; }

  function connPath(from: NK, to: NK): string {
    const fn = nodes[from], tn = nodes[to];
    // Determine direction
    const dx = tn.x - fn.x;
    const dy = tn.y - fn.y;

    if (Math.abs(dy) > Math.abs(dx) * 1.5) {
      // Mostly vertical
      const sx = fn.x, sy = dy > 0 ? nodeBot(from) : nodeTop(from);
      const ex = tn.x, ey = dy > 0 ? nodeTop(to) : nodeBot(to);
      const my = (sy + ey) / 2;
      return `M${sx},${sy} C${sx},${my} ${ex},${my} ${ex},${ey}`;
    }
    // Mostly horizontal
    const sx = nodeRight(from), sy = fn.y;
    const ex = nodeLeft(to), ey = tn.y;
    const mx = (sx + ex) / 2;
    return `M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`;
  }

  // Phase labels
  const phases = [
    { x: 60, label: 'INPUT', y: 48 },
    { x: 340, label: 'DESIGN PIPELINE', y: 48, sub: 'Claude Sonnet, one-shot each' },
    { x: 940, label: 'BUILD', y: 280, sub: 'Claude Code CLI, full sessions' },
  ];

  return (
    <div className="bg-gray-900/30 border border-gray-800/50 rounded-xl overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 700 }}>
        <defs>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Arrow marker */}
          <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,2 L10,5 L0,8" fill="#444" />
          </marker>
          {/* Parallel bracket */}
        </defs>

        {/* Phase region backgrounds */}
        <rect x="5" y="60" width="170" height="170" rx="12" fill="rgba(139,92,246,0.04)" stroke="rgba(139,92,246,0.1)" strokeWidth="1" />
        <rect x="185" y="60" width="510" height="170" rx="12" fill="rgba(59,130,246,0.03)" stroke="rgba(59,130,246,0.08)" strokeWidth="1" />
        <rect x="760" y="270" width="345" height="240" rx="12" fill="rgba(34,197,94,0.03)" stroke="rgba(34,197,94,0.08)" strokeWidth="1" />

        {/* Phase labels */}
        {phases.map((p, i) => (
          <g key={i}>
            <text x={p.x} y={p.y} fill="#555" fontSize="10" fontWeight="bold" letterSpacing="1.5" fontFamily="var(--font-geist-sans)">{p.label}</text>
            {p.sub && <text x={p.x} y={p.y + 13} fill="#333" fontSize="9" fontFamily="var(--font-geist-sans)">{p.sub}</text>}
          </g>
        ))}

        {/* Stage 1 parallel bracket */}
        <text x="195" y="155" fill="#444" fontSize="7" fontFamily="var(--font-geist-mono)" letterSpacing="0.8" transform="rotate(-90 195 155)">STAGE 1</text>
        {/* Stage 2 parallel bracket */}
        <text x="405" y="155" fill="#444" fontSize="7" fontFamily="var(--font-geist-mono)" letterSpacing="0.8" transform="rotate(-90 405 155)">STAGE 2</text>

        {/* Connection lines */}
        {connections.map(([from, to], i) => (
          <path
            key={i}
            d={connPath(from, to)}
            fill="none"
            stroke="#333"
            strokeWidth="1.2"
            markerEnd="url(#arrow)"
          />
        ))}

        {/* Nodes */}
        {(Object.entries(nodes) as [NK, typeof nodes[NK]][]).map(([key, n]) => {
          const isSmall = ['ariadne','eames','yusuf','mal','arthur','cobb','prototype'].includes(key);
          const h = isSmall ? smallNodeH : nodeH;
          const rx = nodeR;
          return (
            <g key={key}>
              {/* Glow behind */}
              <rect
                x={n.x - n.w / 2} y={n.y - h / 2}
                width={n.w} height={h} rx={rx}
                fill={n.color} opacity={0.08}
                filter="url(#glow)"
              />
              {/* Node body */}
              <rect
                x={n.x - n.w / 2} y={n.y - h / 2}
                width={n.w} height={h} rx={rx}
                fill="#0d0e14"
                stroke={n.color} strokeWidth="1.2"
              />
              {/* Color accent bar */}
              <rect
                x={n.x - n.w / 2} y={n.y - h / 2}
                width="3" height={h} rx="1.5"
                fill={n.color} opacity={0.8}
              />
              {/* Label */}
              <text
                x={n.x - n.w / 2 + 12} y={n.sub ? n.y - 3 : n.y + 1}
                fill="#e5e7eb" fontSize={isSmall ? '10' : '11'} fontWeight="bold"
                fontFamily="var(--font-geist-sans)"
              >
                {n.label}
              </text>
              {/* Sublabel */}
              {n.sub && (
                <text
                  x={n.x - n.w / 2 + 12} y={n.y + (isSmall ? 9 : 11)}
                  fill="#666" fontSize={isSmall ? '8' : '9'}
                  fontFamily="var(--font-geist-sans)"
                >
                  {n.sub}
                </text>
              )}
              {/* Dot indicator */}
              <circle
                cx={n.x + n.w / 2 - 8} cy={n.y}
                r="3" fill={n.color} opacity={0.6}
              />
            </g>
          );
        })}

        {/* Phase 1 / Phase 2 label in build section */}
        <text x="775" y="318" fill="#444" fontSize="8" fontFamily="var(--font-geist-mono)" letterSpacing="1">PHASE 1</text>
        <text x="910" y="355" fill="#444" fontSize="8" fontFamily="var(--font-geist-mono)" letterSpacing="1">PHASE 2 (PARALLEL)</text>

      </svg>
    </div>
  );
}

function DetailCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4">
      <div className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">{title}</div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-500 flex gap-2">
            <span className="text-gray-700 shrink-0">--</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
