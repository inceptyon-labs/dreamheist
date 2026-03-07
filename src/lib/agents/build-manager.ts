// Build Manager - spawns and manages Claude Code processes for the build phase
// Each agent is a separate Claude Code process streaming JSON events
// All state is persisted to SQLite so it survives Next.js HMR/worker isolation

import { spawn, ChildProcess } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readdirSync, statSync, readFileSync } from 'fs';
import path from 'path';
import { createInterface } from 'readline';
import { broadcast } from '../realtime/sse';
import { BUILD_AGENTS, getBuildPrompt } from './personalities';
import { checkMilestone, clearSessionMilestones } from './quotes';
import {
  upsertBuildState, updateBuildStatus, getBuildState,
  upsertBuildAgent, getBuildAgents,
  insertBuildEvent, getBuildEventsFromDb,
} from '../storage/db';

export interface BuildEvent {
  timestamp: string;
  agentRole: string;
  agentCodename: string;
  type: 'text' | 'tool_use' | 'tool_result' | 'status' | 'error' | 'complete' | 'file_changed';
  data: {
    text?: string;
    toolName?: string;
    toolInput?: Record<string, unknown>;
    toolResult?: string;
    filePath?: string;
    status?: string;
    [key: string]: unknown;
  };
}

// In-memory map ONLY for tracking live process handles (for stopping builds)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
function getLiveProcesses(): Map<string, Map<string, ChildProcess>> {
  if (!g.__dreamheist_processes__) {
    g.__dreamheist_processes__ = new Map();
  }
  return g.__dreamheist_processes__;
}

export function getBuildStatus(sessionId: string) {
  const state = getBuildState(sessionId);
  if (!state) return null;

  const agentRows = getBuildAgents(sessionId);
  const agents: Record<string, { status: string; eventCount: number }> = {};
  for (const row of agentRows) {
    agents[row.role] = { status: row.status, eventCount: 0 };
  }

  return {
    status: state.status,
    buildDir: state.buildDir,
    agents,
  };
}

export function getBuildEvents(sessionId: string, since?: number): BuildEvent[] {
  const rows = getBuildEventsFromDb(sessionId, since);
  return rows.map(row => ({
    timestamp: row.timestamp,
    agentRole: row.agentRole,
    agentCodename: row.agentCodename,
    type: row.type as BuildEvent['type'],
    data: JSON.parse(row.data),
  }));
}

export function getBuildFiles(sessionId: string): Array<{ path: string; size: number; modified: string }> {
  const state = getBuildState(sessionId);
  if (!state) return [];

  const files: Array<{ path: string; size: number; modified: string }> = [];
  const buildDir = state.buildDir;

  if (!existsSync(buildDir)) return files;

  function walk(dir: string) {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (entry === 'node_modules' || entry === '.git' || entry === '.next' || entry === '.dreamheist-logs') continue;
        const full = path.join(dir, entry);
        try {
          const stat = statSync(full);
          if (stat.isDirectory()) {
            walk(full);
          } else {
            files.push({
              path: full.replace(buildDir + '/', ''),
              size: stat.size,
              modified: stat.mtime.toISOString(),
            });
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  walk(buildDir);
  return files.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
}

export function getFileContent(sessionId: string, filePath: string): string | null {
  const state = getBuildState(sessionId);
  if (!state) return null;

  const fullPath = path.join(state.buildDir, filePath);
  if (!existsSync(fullPath)) return null;

  try {
    return readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

function writeBuildClaudeMd(buildDir: string) {
  const claudeMd = `# Build Project

This project is being built by multiple AI agents in parallel.

## Available MCP Servers
- **Context7** — Look up latest library documentation. Use mcp__plugin_context7_context7__resolve-library-id to find a library, then mcp__plugin_context7_context7__query-docs to get docs. Cobb MUST use this to check Next.js docs before scaffolding.

## Available Skills (MANDATORY for Eames)
These skills are available via the Skill tool. Eames MUST use them — the UI quality depends on it.

How to invoke: Use the Skill tool with the skill_name parameter set to the skill name below.

- impeccable:frontend-design — REQUIRED on all major UI components. Makes them distinctive instead of generic.
- impeccable:animate — add micro-interactions to interactive elements
- impeccable:polish — final alignment/spacing/consistency pass
- impeccable:colorize — add color to flat/monochromatic designs
- nano-banana — generate images via AI. Use with "--transparent" in the prompt for logos/icons.

## First-Time User Experience (REQUIRED)
The product MUST have a welcome/intro modal on first visit. Users have zero context.
Include: product name, what it does, how to use it (controls for games, workflow for tools), and a "Get Started" button. Use localStorage to only show once.

## Testing
Tests are in src/__tests__/. Run \`npx vitest --reporter=verbose\` to check test status.
Mal (the Shade) writes tests. Builders should make them pass.

## Commands
- \`pnpm install\` — install dependencies
- \`npx vitest\` — run tests
- \`pnpm dev\` — start dev server
`;
  writeFileSync(path.join(buildDir, 'CLAUDE.md'), claudeMd);
}

export async function launchBuild(
  sessionId: string,
  artifacts: {
    specToBuild: string;
    taskList: string;
    masterPrompt: string;
    productName: string;
    tagline: string;
  }
) {
  clearSessionMilestones(sessionId);

  const buildDir = path.join(process.cwd(), 'builds', `session-${sessionId}`);
  const logDir = path.join(buildDir, '.dreamheist-logs');
  mkdirSync(buildDir, { recursive: true });
  mkdirSync(logDir, { recursive: true });

  // Persist build state to SQLite
  upsertBuildState(sessionId, buildDir, 'running');

  console.log(`[BUILD] Launching build for session ${sessionId} in ${buildDir}`);

  // Define agent execution order (with parallelism and TDD head-start)
  // Phase 1: Cobb sets up the project foundation (fast scaffolding)
  // Phase 2: Mal gets a head start writing tests (~60s) before builders launch
  // Phase 3: Builders implement to pass Mal's tests, Arthur reviews
  const phases: Array<{ agents: string[]; delayMs?: number; thenAgents?: string[] }> = [
    { agents: ['extractor'] },
    { agents: ['shade'], delayMs: 60000, thenAgents: ['architect', 'forger', 'builder', 'auditor'] },
  ];

  // Initialize all agents in DB
  for (const role of Object.keys(BUILD_AGENTS)) {
    upsertBuildAgent(sessionId, role, 'pending');
  }

  // Broadcast initial state
  persistAndBroadcast(sessionId, {
    timestamp: new Date().toISOString(),
    agentRole: 'system',
    agentCodename: 'System',
    type: 'status',
    data: { status: 'Build initiated. Agents assembling...' },
  });

  // Write a CLAUDE.md into the build dir so spawned agents have skill access
  writeBuildClaudeMd(buildDir);

  // Run phases sequentially, with optional TDD head-start delays
  for (const phase of phases) {
    // Launch primary agents
    const primaryPromises = phase.agents.map(role => runAgent(sessionId, role, artifacts, buildDir, logDir));

    if (phase.delayMs && phase.thenAgents) {
      // TDD head-start: let primary agents (Mal) run for delayMs, then launch builders
      const delay = new Promise<void>(resolve => setTimeout(resolve, phase.delayMs!));

      persistAndBroadcast(sessionId, {
        timestamp: new Date().toISOString(),
        agentRole: 'system',
        agentCodename: 'System',
        type: 'status',
        data: { status: `Mal is writing tests... builders launch in ${Math.round(phase.delayMs / 1000)}s` },
      });

      await delay;

      persistAndBroadcast(sessionId, {
        timestamp: new Date().toISOString(),
        agentRole: 'system',
        agentCodename: 'System',
        type: 'status',
        data: { status: 'Tests are planted. Builders entering the dream...' },
      });

      const secondaryPromises = phase.thenAgents.map(role => runAgent(sessionId, role, artifacts, buildDir, logDir));
      await Promise.all([...primaryPromises, ...secondaryPromises]);
    } else {
      await Promise.all(primaryPromises);
    }

    // Phase 1 (extractor) failure is critical — can't continue without scaffolding
    if (!phase.thenAgents) {
      const agentStatuses = getBuildAgents(sessionId);
      const extractorFailed = phase.agents.some(role => {
        const agent = agentStatuses.find(a => a.role === role);
        return agent?.status === 'failed';
      });
      if (extractorFailed) {
        updateBuildStatus(sessionId, 'failed');
        persistAndBroadcast(sessionId, {
          timestamp: new Date().toISOString(),
          agentRole: 'system',
          agentCodename: 'System',
          type: 'error',
          data: { text: 'Build failed. Scaffolding agent encountered an error.' },
        });
        return;
      }
    }
  }

  // Build done — mark completed even if some agents failed (user can restart them)
  const finalStatuses = getBuildAgents(sessionId);
  const anyFailed = finalStatuses.some(a => a.status === 'failed');
  updateBuildStatus(sessionId, anyFailed ? 'completed' : 'completed');
  persistAndBroadcast(sessionId, {
    timestamp: new Date().toISOString(),
    agentRole: 'system',
    agentCodename: 'System',
    type: 'complete',
    data: {
      status: anyFailed
        ? 'Build complete with issues. Some agents can be restarted.'
        : 'Build complete. The dream is real.',
      buildDir,
    },
  });
}

async function runAgent(
  sessionId: string,
  role: string,
  artifacts: {
    specToBuild: string;
    taskList: string;
    masterPrompt: string;
    productName: string;
    tagline: string;
  },
  buildDir: string,
  logDir: string,
): Promise<void> {
  const agent = BUILD_AGENTS[role];
  if (!agent) return;

  const prompt = getBuildPrompt(role, artifacts, buildDir);

  console.log(`[BUILD] Starting agent ${role} (${agent.codename}) for session ${sessionId}`);
  upsertBuildAgent(sessionId, role, 'running');

  persistAndBroadcast(sessionId, {
    timestamp: new Date().toISOString(),
    agentRole: role,
    agentCodename: agent.codename,
    type: 'status',
    data: { status: `${agent.codename} is entering the dream...` },
  });

  return new Promise<void>((resolve) => {
    try {
      // Spawn Claude Code process with turn limits to prevent runaway agents
      const maxTurns = role === 'extractor' ? 15 : role === 'auditor' ? 30 : role === 'shade' ? 25 : 40;
      console.log(`[BUILD] Agent ${role} using model: ${agent.model}, max-turns: ${maxTurns}`);
      const proc = spawn('claude', [
        '-p', prompt,
        '--output-format', 'stream-json',
        '--verbose',
        '--no-session-persistence',
        '--dangerously-skip-permissions',
        '--model', agent.model,
        '--max-turns', String(maxTurns),
      ], {
        cwd: buildDir,
        env: {
          ...process.env,
          CLAUDECODE: '', // Allow nested Claude Code
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Hard timeout — gracefully end agent if it runs longer than 5 minutes
      let timedOut = false;
      const hardTimeout = setTimeout(() => {
        timedOut = true;
        console.log(`[BUILD] Agent ${role} hit 5-minute time limit, wrapping up`);
        proc.kill('SIGTERM');
      }, 5 * 60 * 1000);

      // Track process handle for stopping
      let procs = getLiveProcesses().get(sessionId);
      if (!procs) {
        procs = new Map();
        getLiveProcesses().set(sessionId, procs);
      }
      procs.set(role, proc);

      console.log(`[BUILD] Spawned claude process PID=${proc.pid} for ${role}`);

      // Parse stdout stream-json line by line
      const rl = createInterface({ input: proc.stdout! });
      const logFile = path.join(logDir, `${role}.jsonl`);

      rl.on('line', (line) => {
        if (!line.trim()) return;
        try {
          const event = JSON.parse(line);
          const buildEvent = parseStreamEvent(event, role, agent.codename);
          if (buildEvent) {
            persistAndBroadcast(sessionId, buildEvent);
            // Write to log file
            try { writeFileSync(logFile, line + '\n', { flag: 'a' }); } catch { /* ok */ }
          }
        } catch {
          // Non-JSON line, treat as text
          persistAndBroadcast(sessionId, {
            timestamp: new Date().toISOString(),
            agentRole: role,
            agentCodename: agent.codename,
            type: 'text',
            data: { text: line },
          });
        }
      });

      // Capture stderr
      const stderrChunks: string[] = [];
      proc.stderr?.on('data', (chunk) => {
        stderrChunks.push(chunk.toString());
      });

      proc.on('close', (code) => {
        clearTimeout(hardTimeout);
        console.log(`[BUILD] Agent ${role} (PID=${proc.pid}) exited with code ${code}${timedOut ? ' (timed out)' : ''}`);
        // Only treat clean exits as completed — timeouts show as failed so user can restart
        const isGraceful = code === 0 || code === null;
        upsertBuildAgent(sessionId, role, isGraceful ? 'completed' : 'failed');

        // Clean up process handle
        getLiveProcesses().get(sessionId)?.delete(role);

        if (!isGraceful) {
          if (timedOut) {
            persistAndBroadcast(sessionId, {
              timestamp: new Date().toISOString(),
              agentRole: role,
              agentCodename: agent.codename,
              type: 'error',
              data: { text: `${agent.codename} lost in limbo — timed out after 5 minutes. Restart to try again.` },
            });
          } else {
            const errorText = stderrChunks.join('').slice(0, 500);
            persistAndBroadcast(sessionId, {
              timestamp: new Date().toISOString(),
              agentRole: role,
              agentCodename: agent.codename,
              type: 'error',
              data: { text: `${agent.codename} exited with code ${code}. ${errorText}` },
            });
          }
        } else {
          persistAndBroadcast(sessionId, {
            timestamp: new Date().toISOString(),
            agentRole: role,
            agentCodename: agent.codename,
            type: 'status',
            data: { status: `${agent.codename} has completed their work.` },
          });
        }

        resolve();
      });

      proc.on('error', (err) => {
        clearTimeout(hardTimeout);
        console.error(`[BUILD] Agent ${role} spawn error:`, err.message);
        upsertBuildAgent(sessionId, role, 'failed');
        getLiveProcesses().get(sessionId)?.delete(role);
        persistAndBroadcast(sessionId, {
          timestamp: new Date().toISOString(),
          agentRole: role,
          agentCodename: agent.codename,
          type: 'error',
          data: { text: `Failed to launch ${agent.codename}: ${err.message}` },
        });
        resolve();
      });

    } catch (err) {
      upsertBuildAgent(sessionId, role, 'failed');
      persistAndBroadcast(sessionId, {
        timestamp: new Date().toISOString(),
        agentRole: role,
        agentCodename: agent.codename,
        type: 'error',
        data: { text: `Error launching ${agent.codename}: ${err}` },
      });
      resolve();
    }
  });
}

function parseStreamEvent(event: Record<string, unknown>, role: string, codename: string): BuildEvent | null {
  const timestamp = new Date().toISOString();
  const type = event.type as string;

  // Handle different stream-json event types
  if (type === 'assistant') {
    const message = event.message as Record<string, unknown> | undefined;
    const content = (message?.content || event.content) as Array<Record<string, unknown>> | undefined;

    if (content && Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'text' && block.text) {
          return {
            timestamp,
            agentRole: role,
            agentCodename: codename,
            type: 'text',
            data: { text: block.text as string },
          };
        }
        if (block.type === 'tool_use') {
          return {
            timestamp,
            agentRole: role,
            agentCodename: codename,
            type: 'tool_use',
            data: {
              toolName: block.name as string,
              toolInput: block.input as Record<string, unknown>,
              filePath: (block.input as Record<string, unknown>)?.file_path as string | undefined,
            },
          };
        }
      }
    }

    // Simple text response
    if (event.text) {
      return {
        timestamp,
        agentRole: role,
        agentCodename: codename,
        type: 'text',
        data: { text: event.text as string },
      };
    }
  }

  // Content block events (streaming)
  if (type === 'content_block_start' || type === 'content_block_delta') {
    const block = (event.content_block || event.delta) as Record<string, unknown> | undefined;
    if (block?.type === 'text' && block.text) {
      return {
        timestamp,
        agentRole: role,
        agentCodename: codename,
        type: 'text',
        data: { text: block.text as string },
      };
    }
    // Only emit tool_use for content_block_start (which has the name), skip input_json_delta noise
    if (block?.type === 'tool_use' && block.name) {
      return {
        timestamp,
        agentRole: role,
        agentCodename: codename,
        type: 'tool_use',
        data: {
          toolName: block.name as string,
          toolInput: (block.input || {}) as Record<string, unknown>,
          filePath: (block.input as Record<string, unknown>)?.file_path as string | undefined,
        },
      };
    }
  }

  // Claude Code system events (tool execution, skill invocations)
  if (type === 'system' && event.subtype === 'tool_use') {
    return {
      timestamp,
      agentRole: role,
      agentCodename: codename,
      type: 'tool_use',
      data: {
        toolName: (event.tool as string) || '',
        toolInput: (event.input || {}) as Record<string, unknown>,
        filePath: (event.input as Record<string, unknown>)?.file_path as string | undefined,
      },
    };
  }

  // Tool result
  if (type === 'result') {
    return {
      timestamp,
      agentRole: role,
      agentCodename: codename,
      type: 'complete',
      data: {
        text: (event.result as string) || 'Agent completed.',
        cost: event.cost_usd as number | undefined,
        duration: event.duration_ms as number | undefined,
      },
    };
  }

  return null;
}

function persistAndBroadcast(sessionId: string, event: BuildEvent) {
  // Write to SQLite
  insertBuildEvent(sessionId, event);

  // Broadcast via SSE
  broadcast(sessionId, {
    type: 'agent_status_changed',
    data: {
      sessionId,
      buildEvent: event,
    },
  });

  // Check for milestone quotes and broadcast them as separate events
  const quote = checkMilestone(
    sessionId,
    event.agentRole,
    event.agentCodename,
    event.type,
    event.data.toolName,
  );
  if (quote) {
    const quoteEvent: BuildEvent = {
      timestamp: new Date().toISOString(),
      agentRole: quote.agentRole,
      agentCodename: quote.agentCodename,
      type: 'text',
      data: { text: `"${quote.quote}"`, milestone: quote.milestone },
    };
    insertBuildEvent(sessionId, quoteEvent);
    broadcast(sessionId, {
      type: 'agent_status_changed',
      data: {
        sessionId,
        buildEvent: quoteEvent,
      },
    });
  }
}

// Preview server management — spawns pnpm dev in the build dir
function getPreviewServers(): Map<string, { proc: ChildProcess; port: number }> {
  if (!g.__dreamheist_preview_servers__) {
    g.__dreamheist_preview_servers__ = new Map();
  }
  return g.__dreamheist_preview_servers__;
}

export async function startPreviewServer(sessionId: string): Promise<{ port: number; alreadyRunning: boolean }> {
  const existing = getPreviewServers().get(sessionId);
  if (existing) {
    return { port: existing.port, alreadyRunning: true };
  }

  const state = getBuildState(sessionId);
  if (!state) throw new Error('No build found for session');

  const buildDir = state.buildDir;
  if (!existsSync(buildDir)) throw new Error('Build directory does not exist');

  // Find an available port starting from 4000
  const basePort = 4000 + Math.abs(hashCode(sessionId) % 1000);
  const port = await findAvailablePort(basePort);

  const proc = spawn('pnpm', ['dev', '--port', String(port)], {
    cwd: buildDir,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  getPreviewServers().set(sessionId, { proc, port });

  // Wait briefly for the server to start
  await new Promise<void>((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => { if (!resolved) { resolved = true; resolve(); } }, 5000);

    const rl = createInterface({ input: proc.stdout! });
    rl.on('line', (line) => {
      if (line.includes('Ready') || line.includes('ready') || line.includes('localhost') || line.includes(`${port}`)) {
        if (!resolved) { resolved = true; clearTimeout(timeout); resolve(); }
      }
    });

    proc.on('error', () => {
      if (!resolved) { resolved = true; clearTimeout(timeout); resolve(); }
    });
  });

  proc.on('close', () => {
    getPreviewServers().delete(sessionId);
  });

  return { port, alreadyRunning: false };
}

export function getPreviewServerPort(sessionId: string): number | null {
  return getPreviewServers().get(sessionId)?.port || null;
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

async function findAvailablePort(start: number): Promise<number> {
  const net = await import('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(start, () => {
      server.close(() => resolve(start));
    });
    server.on('error', () => {
      resolve(findAvailablePort(start + 1));
    });
  });
}

export async function rerunBuildAgent(
  sessionId: string,
  role: string,
  artifacts: {
    specToBuild: string;
    taskList: string;
    masterPrompt: string;
    productName: string;
    tagline: string;
  }
) {
  const state = getBuildState(sessionId);
  if (!state) throw new Error('No build found for session');

  const buildDir = state.buildDir;
  const logDir = path.join(buildDir, '.dreamheist-logs');
  mkdirSync(logDir, { recursive: true });

  // Kill any existing process for this agent
  const procs = getLiveProcesses().get(sessionId);
  const existing = procs?.get(role);
  if (existing) {
    existing.kill('SIGTERM');
    procs?.delete(role);
  }

  persistAndBroadcast(sessionId, {
    timestamp: new Date().toISOString(),
    agentRole: 'system',
    agentCodename: 'System',
    type: 'status',
    data: { status: `Re-entering the dream: ${BUILD_AGENTS[role]?.codename || role}...` },
  });

  // If the overall build was completed/failed, set it back to running
  if (state.status !== 'running') {
    updateBuildStatus(sessionId, 'running');
  }

  await runAgent(sessionId, role, artifacts, buildDir, logDir);

  // Check if all agents are now done
  const agentStatuses = getBuildAgents(sessionId);
  const allDone = agentStatuses.every(a => a.status === 'completed' || a.status === 'failed');
  if (allDone) {
    const anyFailed = agentStatuses.some(a => a.status === 'failed');
    updateBuildStatus(sessionId, anyFailed ? 'failed' : 'completed');
    persistAndBroadcast(sessionId, {
      timestamp: new Date().toISOString(),
      agentRole: 'system',
      agentCodename: 'System',
      type: 'complete',
      data: { status: 'Build complete. The dream is real.', buildDir },
    });
  }
}

export function stopBuild(sessionId: string) {
  clearSessionMilestones(sessionId);

  // Kill any live processes
  const procs = getLiveProcesses().get(sessionId);
  if (procs) {
    for (const [role, proc] of procs) {
      proc.kill('SIGTERM');
      upsertBuildAgent(sessionId, role, 'failed');
    }
    procs.clear();
  }
  // Kill preview server if running
  const preview = getPreviewServers().get(sessionId);
  if (preview) {
    preview.proc.kill('SIGTERM');
    getPreviewServers().delete(sessionId);
  }
  updateBuildStatus(sessionId, 'failed');
}
