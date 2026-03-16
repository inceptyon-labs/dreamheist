'use client';

import { useState, useEffect, useCallback } from 'react';

interface Slide {
  title: string;
  content: React.ReactNode;
}

function SlideShell({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent(i => Math.min(i + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setCurrent(i => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  const slide = slides[current];

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-gray-200 flex flex-col select-none">
      <div className="flex-1 flex items-center justify-center p-12 overflow-y-auto">
        <div className="max-w-5xl w-full">
          {slide.content}
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-800/50 px-8 py-4 flex items-center justify-between">
        <button
          onClick={prev}
          disabled={current === 0}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>

        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                i === current ? 'bg-blue-400 scale-125' : 'bg-gray-700 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors cursor-pointer"
        >
          Next
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8 4L14 10L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      <div className="absolute top-6 left-8 flex items-center gap-3">
        <a href="/slides/orchestration" className="text-xs text-gray-700 hover:text-gray-400 transition-colors">
          Orchestration Slides &rarr;
        </a>
      </div>
      <div className="absolute top-6 right-8 text-xs text-gray-700 font-mono">
        {current + 1} / {slides.length}
      </div>
    </div>
  );
}

// ─── Agent Colors ─────────────────────────────────────────

const C = {
  fischer: '#f43f5e', ariadne: '#06b6d4', eames: '#a855f7',
  yusuf: '#22c55e', mal: '#ef4444', arthur: '#f97316',
  cobb: '#3b82f6',
};

// ─── Slides ───────────────────────────────────────────────

const slides: Slide[] = [
  // ── 0: Welcome ──
  {
    title: 'Welcome',
    content: (
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-gray-600 mb-8">Dream Heist</div>
        <h1 className="text-7xl font-bold tracking-tight mb-6">Building with AI Agents</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
          What happens when you give seven AI agents a spec and tell them to build a product — live, in parallel, in front of an audience?
        </p>
        <div className="flex justify-center gap-6 mt-8">
          <a href="/slides/orchestration" className="bg-gray-900/60 border border-gray-800/50 rounded-xl px-8 py-5 hover:border-gray-600 transition-colors group">
            <div className="text-xs text-gray-600 uppercase tracking-widest mb-2">Part 1</div>
            <div className="text-lg font-bold text-gray-300 group-hover:text-white transition-colors">Agents at Work</div>
            <div className="text-xs text-gray-600 mt-1">The orchestration phase</div>
          </a>
          <a href="/slides/build" className="bg-gray-900/60 border border-blue-900/40 rounded-xl px-8 py-5 hover:border-blue-700 transition-colors group">
            <div className="text-xs text-blue-400/60 uppercase tracking-widest mb-2">Part 2</div>
            <div className="text-lg font-bold text-blue-300 group-hover:text-blue-200 transition-colors">The Dream Lab</div>
            <div className="text-xs text-gray-600 mt-1">The build phase</div>
          </a>
        </div>
      </div>
    ),
  },

  // ── 1: Title ──
  {
    title: 'Dream Lab',
    content: (
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-gray-600 mb-6">Entering</div>
        <h1 className="text-6xl font-bold tracking-tight mb-6">The Dream Lab</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Seven AI agents are building a real product from that spec — in parallel, each with their own Claude Code process.
        </p>
        <div className="mt-10 grid grid-cols-7 gap-2 max-w-3xl mx-auto">
          {[
            { name: 'Fischer', model: 'Haiku', color: C.fischer },
            { name: 'Mal', model: 'Opus', color: C.mal },
            { name: 'Eames', model: 'Opus', color: C.eames },
            { name: 'Ariadne', model: 'Opus', color: C.ariadne },
            { name: 'Yusuf', model: 'Sonnet', color: C.yusuf },
            { name: 'Cobb', model: 'Sonnet', color: C.cobb },
            { name: 'Arthur', model: 'Sonnet', color: C.arthur },
          ].map(a => (
            <div key={a.name} className="text-center">
              <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: a.color }} />
              <div className="text-xs font-bold" style={{ color: a.color }}>{a.name}</div>
              <div className="text-[10px] text-gray-600">{a.model}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ── 2: Phase Diagram ──
  {
    title: 'Build Phases',
    content: (
      <div>
        <h2 className="text-4xl font-bold tracking-tight mb-2">Build Phases</h2>
        <p className="text-gray-500 mb-8">Sequential dependencies with maximum parallelism.</p>

        <div className="space-y-6">
          {/* Phase 1 */}
          <div className="flex gap-4 items-start">
            <div className="w-28 shrink-0 text-right">
              <div className="text-xs text-gray-600 font-mono">Phase 1</div>
              <div className="text-[10px] text-gray-700">~2 min</div>
            </div>
            <div className="flex-1">
              <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4 max-w-xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.fischer }} />
                  <span className="text-sm font-bold" style={{ color: C.fischer }}>Fischer</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">Haiku</span>
                </div>
                <p className="text-xs text-gray-500">Scaffolding: pnpm init, install deps, create folders, configs, API contract</p>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex gap-4 items-start">
            <div className="w-28 shrink-0" />
            <svg width="24" height="20" viewBox="0 0 24 20" fill="none" className="ml-6">
              <path d="M12 0V14M6 10L12 18L18 10" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Phase 2a — TDD head start */}
          <div className="flex gap-4 items-start">
            <div className="w-28 shrink-0 text-right">
              <div className="text-xs text-gray-600 font-mono">Phase 2a</div>
              <div className="text-[10px] text-gray-700">60s head start</div>
            </div>
            <div className="flex gap-3 flex-1">
              <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.mal }} />
                  <span className="text-sm font-bold" style={{ color: C.mal }}>Mal</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">Opus</span>
                </div>
                <p className="text-xs text-gray-500">Writes tests BEFORE implementation exists. TDD — tests define the contract.</p>
              </div>
              <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.eames }} />
                  <span className="text-sm font-bold" style={{ color: C.eames }}>Eames</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">Opus</span>
                </div>
                <p className="text-xs text-gray-500">Creates the design system, generates logo, invokes design Skills</p>
              </div>
            </div>
          </div>

          {/* Phase 2b — Builders join */}
          <div className="flex gap-4 items-start">
            <div className="w-28 shrink-0 text-right">
              <div className="text-xs text-gray-600 font-mono">Phase 2b</div>
              <div className="text-[10px] text-gray-700">~10 min</div>
            </div>
            <div className="flex gap-3 flex-1">
              <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.ariadne }} />
                  <span className="text-sm font-bold" style={{ color: C.ariadne }}>Ariadne</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">Opus</span>
                </div>
                <p className="text-xs text-gray-500">All pages and routing</p>
              </div>
              <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.yusuf }} />
                  <span className="text-sm font-bold" style={{ color: C.yusuf }}>Yusuf</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">Sonnet</span>
                </div>
                <p className="text-xs text-gray-500">API routes and backend</p>
              </div>
              <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.cobb }} />
                  <span className="text-sm font-bold" style={{ color: C.cobb }}>Cobb</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">Sonnet</span>
                </div>
                <p className="text-xs text-gray-500">Types, state, onboarding</p>
              </div>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="flex gap-4 items-start">
            <div className="w-28 shrink-0 text-right">
              <div className="text-xs text-gray-600 font-mono">Phase 3</div>
              <div className="text-[10px] text-gray-700">~3 min</div>
            </div>
            <div className="flex-1">
              <div className="bg-gray-900/60 border border-orange-900/30 rounded-xl p-4 max-w-xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.arthur }} />
                  <span className="text-sm font-bold" style={{ color: C.arthur }}>Arthur</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">Sonnet</span>
                </div>
                <p className="text-xs text-gray-500">Waits for everyone to finish. Fixes imports, wires components, runs the build.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // ── 3: How They Communicate ──
  {
    title: 'How They Communicate',
    content: (
      <div>
        <h2 className="text-4xl font-bold tracking-tight mb-2">How Do They Coordinate?</h2>
        <p className="text-gray-500 mb-8">No message passing. No shared memory. Three simple mechanisms.</p>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
            <div className="text-2xl mb-3">1</div>
            <div className="text-lg font-bold text-white mb-2">File Ownership</div>
            <p className="text-sm text-gray-400 mb-4">
              Each agent owns specific paths. No two agents write to the same file.
            </p>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex gap-2"><span style={{ color: C.eames }}>Eames</span><span className="text-gray-600">src/components/**</span></div>
              <div className="flex gap-2"><span style={{ color: C.ariadne }}>Ariadne</span><span className="text-gray-600">src/app/**/page.tsx</span></div>
              <div className="flex gap-2"><span style={{ color: C.yusuf }}>Yusuf</span><span className="text-gray-600">src/app/api/**</span></div>
              <div className="flex gap-2"><span style={{ color: C.cobb }}>Cobb</span><span className="text-gray-600">src/lib/types.ts</span></div>
              <div className="flex gap-2"><span style={{ color: C.mal }}>Mal</span><span className="text-gray-600">src/__tests__/**</span></div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
            <div className="text-2xl mb-3">2</div>
            <div className="text-lg font-bold text-white mb-2">API Contract</div>
            <p className="text-sm text-gray-400 mb-4">
              Fischer creates a single source of truth for API paths. Everyone reads it.
            </p>
            <div className="bg-gray-950 rounded-lg p-3 text-xs font-mono text-gray-500">
              <div className="text-gray-600 mb-1">// src/lib/api-contract.ts</div>
              <div>export const API = {'{'}</div>
              <div className="ml-4">items: &apos;/api/items&apos;,</div>
              <div className="ml-4">score: &apos;/api/score&apos;,</div>
              <div>{'}'} as const;</div>
            </div>
            <p className="text-xs text-gray-600 mt-3">Yusuf implements these routes. Ariadne fetches from them. No mismatches.</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
            <div className="text-2xl mb-3">3</div>
            <div className="text-lg font-bold text-white mb-2">Shared CLAUDE.md</div>
            <p className="text-sm text-gray-400 mb-4">
              A project-level instruction file written to the build directory. Every agent reads it.
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <div>Lists available MCP servers</div>
              <div>Lists available Skills</div>
              <div>Documents the API contract</div>
              <div>Requires welcome modal</div>
              <div>Testing instructions</div>
            </div>
            <p className="text-xs text-gray-600 mt-3">Same mechanism you use for any Claude Code project.</p>
          </div>
        </div>
      </div>
    ),
  },

  // ── 4: When to Use What ──
  {
    title: 'When to Use What',
    content: (
      <div>
        <h2 className="text-4xl font-bold tracking-tight mb-2">When to Use What</h2>
        <p className="text-gray-500 mb-6">The decision is simpler than it looks. Each primitive answers a different question.</p>

        <div className="space-y-4 mb-6">
          {[
            {
              color: '#f59e0b', label: 'Prompt', when: '"Who should the agent BE?"',
              desc: 'Sets identity, personality, and ground rules. Always loaded. Think: job description for a new hire.',
              example: '"You are Ariadne, the Architect. You see the whole structure before anyone else."',
            },
            {
              color: '#64748b', label: 'Tool (Bash, Read, Write...)', when: '"Do this one thing right now"',
              desc: 'Atomic local actions. Read a file, run a command, write code. Cheap, fast, direct.',
              example: 'Read("src/app/page.tsx") → file contents back in context',
            },
            {
              color: '#06b6d4', label: 'MCP Server', when: '"Go outside and bring something back"',
              desc: 'Reaches into the external world — docs, search, APIs, databases. Returns data. Claude decides what to do with it.',
              example: 'You: "look up Next.js docs" → Claude calls Context7 → structured docs come back',
            },
            {
              color: '#a855f7', label: 'Skill', when: '"I know WHAT to do, but do it at an expert level"',
              desc: 'Downloads temporary expertise. Like calling in a specialist — they take over for one task, then leave. 500 lines of "here\'s exactly how to approach this" load into context.',
              example: 'impeccable:frontend-design → Claude now follows a detailed design methodology',
            },
            {
              color: '#22c55e', label: 'Agent', when: '"This is too big for me — go handle it separately"',
              desc: 'A whole separate Claude with its own memory, tools, and focus. Doesn\'t share your context — communicates through files.',
              example: 'Spawn Eames → gets own 200k context → builds all components → writes to disk',
            },
            {
              color: '#f43f5e', label: 'CLAUDE.md', when: '"Everyone on this project needs to know this"',
              desc: 'Shared rules that every agent reads on startup. The team handbook. Write it once, applies everywhere.',
              example: '"Use pnpm, not npm. API contract is in src/lib/api-contract.ts."',
            },
          ].map(item => (
            <div key={item.label} className="flex gap-4 items-start">
              <div className="w-2 h-full rounded-full shrink-0 mt-1" style={{ backgroundColor: item.color }} />
              <div className="flex-1 bg-gray-900/40 border border-gray-800/40 rounded-xl px-5 py-3">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.label}</span>
                  <span className="text-sm text-white">{item.when}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1.5">{item.desc}</p>
                <div className="text-[10px] font-mono text-gray-600">{item.example}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // ── 5: MCP vs API ──
  {
    title: 'MCP vs API',
    content: (
      <div>
        <h2 className="text-4xl font-bold tracking-tight mb-2">MCP vs API</h2>
        <p className="text-gray-500 mb-6">Both connect agents to external services. MCP adds a standardized layer on top. When is that layer worth it?</p>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5">
            <div className="text-lg font-bold text-gray-400 mb-3">Direct API</div>
            <div className="space-y-2.5 text-xs">
              <div className="flex gap-2"><span className="text-gray-600">1.</span><span className="text-gray-400">Agent must <span className="text-white">know the endpoints upfront</span> — hardcoded or from docs</span></div>
              <div className="flex gap-2"><span className="text-gray-600">2.</span><span className="text-gray-400">Auth tokens <span className="text-white">live in the agent&apos;s context</span> — managed per provider</span></div>
              <div className="flex gap-2"><span className="text-gray-600">3.</span><span className="text-gray-400">Response format varies — agent <span className="text-white">parses each API differently</span></span></div>
              <div className="flex gap-2"><span className="text-gray-600">4.</span><span className="text-gray-400">Swap providers = <span className="text-white">rewrite the integration</span></span></div>
              <div className="flex gap-2"><span className="text-gray-600">5.</span><span className="text-gray-400"><span className="text-white">Zero overhead</span> — no schemas loaded, no protocol layer</span></div>
            </div>
            <div className="mt-3 bg-gray-950 rounded p-2 text-[10px] font-mono text-gray-600">
              fetch(&quot;https://api.perplexity.ai/search&quot;, {'{'} headers: {'{'} Authorization: `Bearer ${'{'} key {'}'}` {'}'} {'}'})
            </div>
            <div className="mt-2 text-[10px] text-gray-600">Direct, fast, no abstraction. You own the whole integration.</div>
          </div>

          <div className="bg-gray-900/50 border border-cyan-900/30 rounded-xl p-5">
            <div className="text-lg font-bold text-cyan-400 mb-3">MCP Server</div>
            <div className="space-y-2.5 text-xs">
              <div className="flex gap-2"><span className="text-cyan-800">1.</span><span className="text-gray-400">Agent <span className="text-white">discovers tools at runtime</span> — typed schema loaded at startup</span></div>
              <div className="flex gap-2"><span className="text-cyan-800">2.</span><span className="text-gray-400">Auth handled <span className="text-white">externally by the server</span> — agent never sees tokens</span></div>
              <div className="flex gap-2"><span className="text-cyan-800">3.</span><span className="text-gray-400">Standardized <span className="text-white">typed JSON</span> response format across all servers</span></div>
              <div className="flex gap-2"><span className="text-cyan-800">4.</span><span className="text-gray-400">Swap providers = <span className="text-white">swap the server</span>, same interface</span></div>
              <div className="flex gap-2"><span className="text-cyan-800">5.</span><span className="text-gray-400">Schemas <span className="text-white">cost context tokens</span> — loaded before any work starts</span></div>
            </div>
            <div className="mt-3 bg-gray-950 rounded p-2 text-[10px] font-mono text-gray-600">
              mcp__perplexity__search(query=&quot;Next.js app router&quot;, recency=&quot;week&quot;)
            </div>
            <div className="mt-2 text-[10px] text-gray-600">Standardized protocol. Agent doesn&apos;t know or care what&apos;s behind the server.</div>
          </div>
        </div>

        {/* When to use which */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div className="bg-gray-900/30 border border-gray-800/40 rounded-xl p-4">
            <div className="text-xs font-bold text-white mb-2">Use direct APIs when...</div>
            <div className="space-y-1.5 text-xs text-gray-500">
              <div>Your tool set is <span className="text-white">fixed and known</span> at build time</div>
              <div>You control the pipeline and <span className="text-white">context tokens are precious</span></div>
              <div>You need <span className="text-white">maximum speed</span> with no protocol overhead</div>
              <div>You&apos;re integrating with <span className="text-white">one or two services</span>, not a dozen</div>
            </div>
          </div>
          <div className="bg-gray-900/30 border border-cyan-900/20 rounded-xl p-4">
            <div className="text-xs font-bold text-cyan-400 mb-2">Use MCP when...</div>
            <div className="space-y-1.5 text-xs text-gray-500">
              <div>Agents need to <span className="text-white">discover tools at runtime</span> they weren&apos;t coded for</div>
              <div>You want to <span className="text-white">swap providers</span> without changing agent code</div>
              <div>Auth and permissions should be <span className="text-white">decoupled from the agent</span></div>
              <div>You&apos;re building a <span className="text-white">platform</span> where users bring their own tools</div>
            </div>
          </div>
        </div>

        {/* The debate */}
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-4">
          <div className="text-xs font-bold text-amber-400 mb-2">The &quot;MCP is dead&quot; debate</div>
          <div className="text-xs text-gray-500 mb-2">
            <span className="text-white">Perplexity&apos;s CTO</span> (March 2026): moving to direct APIs. The schemas <span className="text-white">eat too many context tokens</span> before real work starts, and each server handling its own auth creates friction.
          </div>
          <div className="text-xs text-gray-400">
            <span className="text-white">The counter:</span> MCP&apos;s real value is <span className="text-white">discovery and portability</span>. An API works when you know your tools. MCP lets agents find and use tools they weren&apos;t explicitly programmed for — and swap implementations without changing agent code. Both are valid for different stages of maturity.
          </div>
        </div>
      </div>
    ),
  },

  // ── 6: Context Window ──
  {
    title: 'Context Window',
    content: (
      <div>
        <h2 className="text-4xl font-bold tracking-tight mb-2">The Context Window</h2>
        <p className="text-gray-500 mb-6">The model&apos;s working memory. Not storage — RAM. Everything it knows right now lives here.</p>

        <div className="grid grid-cols-2 gap-6 mb-5">
          {/* What is context */}
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5">
            <div className="text-lg font-bold text-white mb-3">What is &quot;context&quot;?</div>
            <p className="text-sm text-gray-400 leading-relaxed mb-3">
              A fixed-size buffer (~200k tokens for Claude). Every prompt, file read, tool result, and response goes in. When it fills up, older content gets <span className="text-white">compacted</span> — summarized and compressed. Detail is lost.
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              200k tokens &asymp; 150k words &asymp; a 500-page book. Sounds huge, but a single large file read can be 3k tokens. Ten MCP doc fetches can be 50k. It fills up fast.
            </p>
          </div>

          {/* What each primitive costs */}
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5">
            <div className="text-lg font-bold text-white mb-3">What each building block costs</div>
            <div className="space-y-2">
              {[
                { label: 'Prompt + CLAUDE.md', size: '2-5k', color: '#f59e0b', note: 'Always present — shapes behavior' },
                { label: 'Tool (CLI) result', size: '100-5k each', color: '#64748b', note: 'Cmd + stdout, stays in window' },
                { label: 'MCP schema', size: '1-3k total', color: '#06b6d4', note: 'Loaded once at start' },
                { label: 'MCP response', size: '1-10k each', color: '#06b6d4', note: 'Doc fetches can be huge' },
                { label: 'Skill expansion', size: '500-2k each', color: '#a855f7', note: 'Injected instructions on invoke' },
                { label: 'Agent', size: '0 (isolated)', color: '#22c55e', note: 'Own 200k window — doesn\'t share' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1 text-xs text-gray-300">{item.label}</div>
                  <div className="text-xs font-mono text-gray-600 shrink-0 w-16 text-right">{item.size}</div>
                  <div className="text-[10px] text-gray-700 shrink-0 w-40 text-right">{item.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visual: stacked bar */}
        <div className="bg-gray-900/30 border border-gray-800/40 rounded-xl p-5 mb-5">
          <div className="text-sm font-bold text-white mb-1">A typical agent mid-task</div>
          <div className="text-[10px] text-gray-600 mb-4">Each segment = tokens consumed in the ~200k window</div>
          <div className="flex gap-0.5 h-10 rounded-lg overflow-hidden">
            {[
              { pct: 5, color: '#f59e0b', label: 'Prompt' },
              { pct: 3, color: '#f43f5e', label: 'CLAUDE.md' },
              { pct: 2, color: '#06b6d4', label: 'MCP schema' },
              { pct: 8, color: '#a855f7', label: 'Skills' },
              { pct: 18, color: '#64748b', label: 'File reads' },
              { pct: 12, color: '#06b6d4', label: 'MCP results' },
              { pct: 22, color: '#f59e0b', label: 'Tool history' },
              { pct: 15, color: '#22c55e', label: 'Own output' },
              { pct: 15, color: '#1a1a2e', label: 'Free' },
            ].map(seg => (
              <div
                key={seg.label}
                className="flex items-center justify-center group relative"
                style={{
                  flex: seg.pct,
                  backgroundColor: seg.color,
                  border: seg.label === 'Free' ? '1px dashed #333' : 'none',
                  opacity: seg.label === 'Free' ? 0.5 : 0.8,
                }}
              >
                {seg.pct >= 8 && <span className="text-[9px] text-black/60 font-medium">{seg.label}</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-3 flex-wrap">
            {[
              { color: '#f59e0b', label: 'Prompt + history' },
              { color: '#f43f5e', label: 'CLAUDE.md' },
              { color: '#06b6d4', label: 'MCP (schema + results)' },
              { color: '#a855f7', label: 'Skills' },
              { color: '#64748b', label: 'File reads' },
              { color: '#22c55e', label: 'Own output' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
                <span className="text-[10px] text-gray-600">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4">
            <div className="text-xs font-bold text-red-400 mb-1">When it fills up</div>
            <div className="text-xs text-gray-500">
              Older messages get <span className="text-white">compacted</span> — summarized into condensed form. The model loses exact code, re-reads files, repeats work, or forgets decisions. Long-running agents degrade.
            </div>
          </div>
          <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4">
            <div className="text-xs font-bold text-green-400 mb-1">Why multi-agent helps</div>
            <div className="text-xs text-gray-500">
              Each agent gets its <span className="text-white">own 200k window</span>. 7 agents = 1.4M tokens of parallel working memory. Eames never competes with Yusuf for space.
            </div>
          </div>
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
            <div className="text-xs font-bold text-blue-400 mb-1">The trade-off</div>
            <div className="text-xs text-gray-500">
              Isolated context means agents <span className="text-white">can&apos;t see each other&apos;s work</span> in real time. They coordinate through the filesystem instead — file ownership, API contracts, shared CLAUDE.md.
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // ── 6: Agents and Prompts ──
  {
    title: 'Agents & Prompts',
    content: (
      <div>
        <h2 className="text-4xl font-bold tracking-tight mb-2">Agents & Prompts</h2>
        <p className="text-gray-500 mb-8">Each agent is a Claude Code process with a persona, role, and ownership rules.</p>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
            <div className="text-lg font-bold text-white mb-3">What makes an &quot;Agent&quot;</div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: C.ariadne }} />
                <div>
                  <div className="text-sm font-medium text-white">System Prompt</div>
                  <div className="text-xs text-gray-500">Character voice + role definition + technical instructions</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: C.eames }} />
                <div>
                  <div className="text-sm font-medium text-white">Model Selection</div>
                  <div className="text-xs text-gray-500">Opus for creative/complex work, Sonnet for implementation, Haiku for speed</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: C.yusuf }} />
                <div>
                  <div className="text-sm font-medium text-white">File Ownership</div>
                  <div className="text-xs text-gray-500">Explicit paths each agent can and cannot touch</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: C.mal }} />
                <div>
                  <div className="text-sm font-medium text-white">Task Context</div>
                  <div className="text-xs text-gray-500">The full product spec, build directory path, and upstream outputs</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
            <div className="text-lg font-bold text-white mb-3">Why Personas?</div>
            <p className="text-sm text-gray-400 leading-relaxed mb-3">
              The Inception character voices aren&apos;t just for show. They serve three purposes:
            </p>
            <div className="space-y-2">
              <div className="flex gap-2 text-sm">
                <span className="text-blue-400 shrink-0">1.</span>
                <span className="text-gray-300"><span className="text-white">Readable logs.</span> When 7 agents stream events simultaneously, character voice makes it instantly clear who said what.</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-blue-400 shrink-0">2.</span>
                <span className="text-gray-300"><span className="text-white">Role reinforcement.</span> &quot;You are the Point Man who verifies everything&quot; makes the model more thorough than &quot;please review the code.&quot;</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-blue-400 shrink-0">3.</span>
                <span className="text-gray-300"><span className="text-white">Demo theater.</span> The audience is watching. Character makes it watchable.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/30 border border-gray-800/40 rounded-xl p-4">
          <div className="text-xs font-mono text-gray-600 mb-2">Anatomy of a build agent prompt</div>
          <pre className="text-xs text-gray-500 font-mono leading-relaxed">
{`[System Prompt]     "You are Ariadne, the Architect. You see the whole structure..."
[Product Spec]      The full master build prompt from Stage 1
[File Ownership]    "YOU OWN: src/app/**/page.tsx. DO NOT touch: src/components/**"
[Interactivity]     "Must be interactive within 5 seconds. No dashboards."
[Aesthetic]         "Commit FULLY to the voted aesthetic. Every pixel."
[Build Directory]   "Work in: builds/session-abc123/"`}
          </pre>
        </div>
      </div>
    ),
  },

  // ── 7: Why Parallel Agents? ──
  {
    title: 'Why Not One-Shot?',
    content: (
      <div>
        <h2 className="text-4xl font-bold tracking-tight mb-2">Why Not Just Let Opus Do It All?</h2>
        <p className="text-gray-500 mb-8">The trade-offs of multi-agent vs. single-agent approaches.</p>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
            <div className="text-lg font-bold text-white mb-4">Single Agent (Opus 1-shot)</div>
            <div className="space-y-2">
              <div className="flex gap-2 text-sm"><span className="text-green-400">+</span><span className="text-gray-300">Perfect coherence — one mind, one vision</span></div>
              <div className="flex gap-2 text-sm"><span className="text-green-400">+</span><span className="text-gray-300">No coordination overhead</span></div>
              <div className="flex gap-2 text-sm"><span className="text-green-400">+</span><span className="text-gray-300">Simpler architecture</span></div>
              <div className="flex gap-2 text-sm mt-3"><span className="text-red-400">-</span><span className="text-gray-300">Sequential — 15+ min for a full app</span></div>
              <div className="flex gap-2 text-sm"><span className="text-red-400">-</span><span className="text-gray-300">Context window limits — forgets early decisions</span></div>
              <div className="flex gap-2 text-sm"><span className="text-red-400">-</span><span className="text-gray-300">One model strength — can&apos;t mix Haiku speed with Opus quality</span></div>
              <div className="flex gap-2 text-sm"><span className="text-red-400">-</span><span className="text-gray-300">Single point of failure</span></div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-blue-900/30 rounded-xl p-6">
            <div className="text-lg font-bold text-blue-300 mb-4">Multi-Agent (Dream Heist)</div>
            <div className="space-y-2">
              <div className="flex gap-2 text-sm"><span className="text-green-400">+</span><span className="text-gray-300">Parallel — 7 agents working simultaneously</span></div>
              <div className="flex gap-2 text-sm"><span className="text-green-400">+</span><span className="text-gray-300">Right model per task — Haiku for scaffolding, Opus for design</span></div>
              <div className="flex gap-2 text-sm"><span className="text-green-400">+</span><span className="text-gray-300">Fault isolation — one agent fails, others continue</span></div>
              <div className="flex gap-2 text-sm"><span className="text-green-400">+</span><span className="text-gray-300">Separation of concerns — each agent focuses deeply</span></div>
              <div className="flex gap-2 text-sm mt-3"><span className="text-red-400">-</span><span className="text-gray-300">Integration complexity — agents can conflict</span></div>
              <div className="flex gap-2 text-sm"><span className="text-red-400">-</span><span className="text-gray-300">Coordination overhead — file ownership rules, API contracts</span></div>
              <div className="flex gap-2 text-sm"><span className="text-red-400">-</span><span className="text-gray-300">Needs an integration pass (Arthur) to wire it up</span></div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-900/30 border border-gray-800/40 rounded-xl p-5">
          <p className="text-sm text-gray-300 leading-relaxed">
            <span className="text-white font-medium">The real answer:</span> it depends on the task. For a focused feature, single-agent is better. For a full-stack app with design, backend, tests, and integration — parallel agents finish in 10 minutes what would take one agent 30+. The trick is the <span className="text-blue-400">coordination contract</span> — file ownership, API contracts, and a shared CLAUDE.md.
          </p>
        </div>
      </div>
    ),
  },

  // ── 8: The Connecting Lines ──
  {
    title: 'The Connecting Lines',
    content: (
      <div>
        <h2 className="text-4xl font-bold tracking-tight mb-2">The Connecting Lines</h2>
        <p className="text-gray-500 mb-8">What you&apos;re seeing on the Dream Lab screen.</p>

        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
            <div className="text-lg font-bold text-white mb-3">What&apos;s streaming</div>
            <p className="text-sm text-gray-400 mb-4">
              Each agent&apos;s Claude Code process emits a stream of JSON events. We capture these and broadcast them via SSE (Server-Sent Events) to every connected browser.
            </p>
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-950 rounded-lg p-3">
                <div className="text-white font-medium mb-1">Text events</div>
                <div className="text-gray-600">Agent thinking out loud. Character commentary.</div>
              </div>
              <div className="bg-gray-950 rounded-lg p-3">
                <div className="text-white font-medium mb-1">Tool use</div>
                <div className="text-gray-600">Read, Write, Edit, Bash, Glob, Grep — every file operation.</div>
              </div>
              <div className="bg-gray-950 rounded-lg p-3">
                <div className="text-purple-300 font-medium mb-1">Skill invocations</div>
                <div className="text-gray-600">When Eames calls impeccable:frontend-design or nano-banana.</div>
              </div>
              <div className="bg-gray-950 rounded-lg p-3">
                <div className="text-cyan-300 font-medium mb-1">MCP calls</div>
                <div className="text-gray-600">When Fischer queries Context7 for Next.js docs.</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6">
            <div className="text-lg font-bold text-white mb-3">What you&apos;re watching for</div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-300 font-medium mb-1">File creation waves</div>
                <div className="text-xs text-gray-500">Watch the file count climb. First configs, then components, then pages, then tests.</div>
              </div>
              <div>
                <div className="text-gray-300 font-medium mb-1">Skill moments</div>
                <div className="text-xs text-gray-500">When Eames invokes nano-banana for the logo or impeccable for design — highlighted in purple.</div>
              </div>
              <div>
                <div className="text-gray-300 font-medium mb-1">Arthur&apos;s integration</div>
                <div className="text-xs text-gray-500">After builders finish, Arthur runs pnpm build. If it compiles, the dream is real.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function BuildSlides() {
  return <><title>Slides: Build — Dream Heist</title><SlideShell slides={slides} /></>;
}
