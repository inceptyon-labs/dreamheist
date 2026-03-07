'use client';

import { useParams } from 'next/navigation';
import { useSession } from '@/lib/hooks';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';

interface BuildEvent {
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

interface BuildFile {
  path: string;
  size: number;
  modified: string;
}

type AgentActivity = 'idle' | 'thinking' | 'writing' | 'reading' | 'editing' | 'running' | 'skill' | 'mcp' | 'complete' | 'failed';

// Swimlane phase columns — agents move left-to-right through these
type Phase = 'waiting' | 'planning' | 'executing' | 'complete';

const PHASE_COLUMNS: Record<Phase, { x: number; label: string }> = {
  waiting:   { x: 22, label: 'Waiting' },
  planning:  { x: 40, label: 'Planning' },
  executing: { x: 62, label: 'Executing' },
  complete:  { x: 84, label: 'Complete' },
};

// Agent row order (top to bottom)
const AGENT_ROW_ORDER = ['extractor', 'architect', 'forger', 'builder', 'shade', 'auditor'];

function activityToPhase(activity: AgentActivity): Phase {
  if (activity === 'idle') return 'waiting';
  if (activity === 'thinking') return 'planning';
  if (activity === 'complete' || activity === 'failed') return 'complete';
  return 'executing'; // writing, reading, editing, running, skill, mcp
}

// SVG totem icons for each agent
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

const MODEL_STYLES: Record<string, { label: string; badge: string; bg: string }> = {
  haiku:  { label: 'Haiku',  badge: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  sonnet: { label: 'Sonnet', badge: 'text-violet-400',  bg: 'bg-violet-400/10 border-violet-400/30' },
  opus:   { label: 'Opus',   badge: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/30' },
};

const AGENTS: Record<string, {
  codename: string;
  title: string;
  color: string;
  glow: string;
  model: string;
  role_hint: string;
}> = {
  extractor: { codename: 'Cobb', title: 'The Extractor', color: '#60a5fa', glow: 'rgba(96,165,250,0.5)', model: 'haiku', role_hint: 'Project scaffolding' },
  architect: { codename: 'Ariadne', title: 'The Architect', color: '#22d3ee', glow: 'rgba(34,211,238,0.5)', model: 'sonnet', role_hint: 'Pages & routing' },
  forger:    { codename: 'Eames', title: 'The Forger', color: '#c084fc', glow: 'rgba(192,132,252,0.5)', model: 'sonnet', role_hint: 'UI components & styling' },
  builder:   { codename: 'Yusuf', title: 'The Builder', color: '#4ade80', glow: 'rgba(74,222,128,0.5)', model: 'sonnet', role_hint: 'API routes & backend' },
  shade:     { codename: 'Mal', title: 'The Shade', color: '#f87171', glow: 'rgba(248,113,113,0.5)', model: 'opus', role_hint: 'Tests & verification' },
  auditor:   { codename: 'Arthur', title: 'The Point Man', color: '#fb923c', glow: 'rgba(251,146,60,0.5)', model: 'opus', role_hint: 'Integration & bug fixes' },
};

function isSkillCall(toolName: string): boolean {
  return toolName === 'Skill' || toolName.toLowerCase().startsWith('skill');
}

function isMcpCall(toolName: string): boolean {
  return toolName.startsWith('mcp__') || toolName.startsWith('mcp_');
}

function toolToActivity(toolName: string): AgentActivity {
  if (isSkillCall(toolName)) return 'skill';
  if (isMcpCall(toolName)) return 'mcp';
  const t = toolName.toLowerCase();
  if (t.includes('write') || t.includes('create')) return 'writing';
  if (t.includes('read') || t.includes('glob') || t.includes('grep') || t.includes('search')) return 'reading';
  if (t.includes('edit') || t.includes('replace')) return 'editing';
  if (t.includes('bash') || t.includes('execute') || t.includes('run')) return 'running';
  return 'thinking';
}

function getSkillOrMcpLabel(toolName: string): string | null {
  if (isSkillCall(toolName)) return 'SKILL';
  if (isMcpCall(toolName)) {
    // Extract server name from mcp__server__tool format
    const parts = toolName.split('__');
    return parts.length >= 2 ? `MCP:${parts[1]}` : 'MCP';
  }
  return null;
}

const ACTIVITY_LABELS: Record<AgentActivity, string> = {
  idle: 'Standing by',
  thinking: 'Planning...',
  writing: 'Constructing',
  reading: 'Surveying',
  editing: 'Constructing',
  running: 'Executing',
  skill: 'Invoking skill',
  mcp: 'Using external tool',
  complete: 'Inception complete',
  failed: 'Lost in Limbo',
};

export default function DreamLabPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { snapshot } = useSession(sessionId);
  const [events, setEvents] = useState<BuildEvent[]>([]);
  const [files, setFiles] = useState<BuildFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [buildStatus, setBuildStatus] = useState<Record<string, unknown> | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [commsHeight, setCommsHeight] = useState(280);
  const [rightToolHeight, setRightToolHeight] = useState(40);
  const [rightFilesHeight, setRightFilesHeight] = useState(30);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState<'arena' | 'comms' | 'tools' | 'files' | 'preview' | null>(null);
  const [previewPort, setPreviewPort] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showKickReveal, setShowKickReveal] = useState(false);
  const [kickDismissed, setKickDismissed] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restarting, setRestarting] = useState<string | null>(null);
  const commsRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buildStartRef = useRef<number | null>(null);
  const prevAgentStatesRef = useRef<Record<string, AgentActivity>>({});
  const prevEventCountRef = useRef<number>(0);

  const playSfx = useCallback((file: string, volume = 0.4) => {
    if (muted) return;
    try {
      const a = new Audio(`/soundfx/${file}`);
      a.volume = volume;
      a.play().catch(() => {});
    } catch { /* ignore */ }
  }, [muted]);

  const handleRestartAgent = useCallback(async (role: string) => {
    setRestarting(role);
    try {
      await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'rerun-agent', role }),
      });
    } catch { /* ignore */ }
    setRestarting(null);
  }, [sessionId]);

  const handleDragStart = useCallback((type: string, startVal: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const rightPanel = (e.target as HTMLElement).closest('[data-right-panel]');
    const panelH = rightPanel?.getBoundingClientRect().height || 800;

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientY - startY;
      if (type === 'comms') {
        setCommsHeight(Math.max(80, Math.min(600, startVal - delta)));
      } else if (type === 'right-tool') {
        const pctDelta = (delta / panelH) * 100;
        setRightToolHeight(Math.max(15, Math.min(70, startVal + pctDelta)));
      } else if (type === 'right-files') {
        const pctDelta = (delta / panelH) * 100;
        setRightFilesHeight(Math.max(10, Math.min(50, startVal + pctDelta)));
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  const pollBuild = useCallback(async () => {
    try {
      const [eventsRes, filesRes, statusRes] = await Promise.all([
        fetch(`/api/build?sessionId=${sessionId}&action=events`),
        fetch(`/api/build?sessionId=${sessionId}&action=files`),
        fetch(`/api/build?sessionId=${sessionId}&action=status`),
      ]);
      if (eventsRes.ok) { const data = await eventsRes.json(); setEvents(data.events || []); }
      if (filesRes.ok) { const data = await filesRes.json(); setFiles(data.files || []); }
      if (statusRes.ok) {
        const data = await statusRes.json();
        setBuildStatus(data.status);
        // Check for existing preview server
        if (data.status?.status === 'completed' && !previewPort) {
          try {
            const previewRes = await fetch(`/api/build?sessionId=${sessionId}&action=preview`);
            if (previewRes.ok) {
              const pData = await previewRes.json();
              if (pData.port) setPreviewPort(pData.port);
            }
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
  }, [sessionId, previewPort]);

  useEffect(() => {
    pollBuild();
    pollRef.current = setInterval(pollBuild, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollBuild]);

  useEffect(() => {
    if (commsRef.current) commsRef.current.scrollTop = commsRef.current.scrollHeight;
  }, [events]);

  useEffect(() => {
    if (!selectedFile) return;
    fetch(`/api/build?sessionId=${sessionId}&action=file&path=${encodeURIComponent(selectedFile)}`)
      .then(r => r.json())
      .then(data => setFileContent(data.content || ''))
      .catch(() => setFileContent('Error loading file'));
  }, [selectedFile, sessionId]);

  const agentStatuses: Record<string, string> = {};
  if (buildStatus && typeof buildStatus === 'object' && 'agents' in buildStatus) {
    const agents = (buildStatus as Record<string, unknown>).agents as Record<string, { status: string }>;
    for (const [role, info] of Object.entries(agents)) agentStatuses[role] = info.status;
  }
  const overallStatus = buildStatus && typeof buildStatus === 'object' ? (buildStatus as Record<string, unknown>).status as string : null;
  const buildDir = buildStatus && typeof buildStatus === 'object' ? (buildStatus as Record<string, unknown>).buildDir as string : null;

  // Live build stats
  const buildStats = useMemo(() => {
    const fileCount = files.length;
    // Estimate LoC from file sizes (code files avg ~30 bytes/line)
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.md', '.html'];
    const totalBytes = files
      .filter(f => codeExtensions.some(ext => f.path.endsWith(ext)))
      .reduce((sum, f) => sum + f.size, 0);
    const estimatedLoC = Math.round(totalBytes / 30);
    const toolUseCount = events.filter(e => e.type === 'tool_use').length;
    const testEvents = events.filter(e => e.agentRole === 'shade' && e.type === 'tool_use');
    const completedAgents = Object.values(agentStatuses).filter(s => s === 'completed').length;
    const totalAgents = Object.keys(AGENTS).length;
    let totalCost = 0;
    for (const e of events) {
      if (e.type === 'complete' && e.data.cost) totalCost += (e.data.cost as number);
    }
    return { fileCount, estimatedLoC, toolUseCount, testEvents: testEvents.length, completedAgents, totalAgents, totalCost };
  }, [events, files, agentStatuses]);

  // "The Kick" reveal — trigger when build transitions to completed
  useEffect(() => {
    if (overallStatus === 'completed' && prevStatusRef.current === 'running' && !kickDismissed) {
      playSfx('the-kick.mp3', 0.6);
      setTimeout(() => playSfx('build-complete.mp3', 0.4), 2000);
      setShowKickReveal(true);
      // Auto-dismiss after 8 seconds
      const t = setTimeout(() => setShowKickReveal(false), 8000);
      return () => clearTimeout(t);
    }
    prevStatusRef.current = overallStatus;
  }, [overallStatus, kickDismissed, playSfx]);

  // Music — play Non, Je Ne Regrette Rien during build
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio('/music/piaf.mp3');
      audio.loop = true;
      audio.volume = 0.3;
      audioRef.current = audio;
    }
    const audio = audioRef.current;
    if (overallStatus === 'running' && !muted) {
      audio.play().catch(() => {}); // browser may block autoplay
    } else if (overallStatus === 'completed') {
      // Fade out over 3 seconds
      const fadeInterval = setInterval(() => {
        if (audio.volume > 0.02) {
          audio.volume = Math.max(0, audio.volume - 0.02);
        } else {
          audio.pause();
          audio.volume = 0.3;
          audio.currentTime = 0;
          clearInterval(fadeInterval);
        }
      }, 100);
      return () => clearInterval(fadeInterval);
    } else if (muted) {
      audio.pause();
    }
  }, [overallStatus, muted]);

  // Build elapsed timer
  useEffect(() => {
    if (overallStatus === 'running') {
      if (!buildStartRef.current) buildStartRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - buildStartRef.current!) / 1000));
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else if (overallStatus === 'completed' || overallStatus === 'failed') {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [overallStatus]);

  const agentActivities = useMemo(() => {
    const activities: Record<string, { activity: AgentActivity; detail: string; lastFile?: string; skillLabel?: string }> = {};
    for (const role of Object.keys(AGENTS)) activities[role] = { activity: 'idle', detail: '' };

    for (const event of events) {
      if (!AGENTS[event.agentRole]) continue;
      const role = event.agentRole;
      if (event.type === 'tool_use') {
        const toolName = event.data.toolName || '';
        const filePath = event.data.filePath || (event.data.toolInput as Record<string, unknown>)?.file_path as string || '';
        const skillLabel = getSkillOrMcpLabel(toolName) || undefined;
        activities[role] = { activity: toolToActivity(toolName), detail: toolName, lastFile: filePath ? filePath.split('/').pop() : undefined, skillLabel };
      } else if (event.type === 'text') {
        activities[role] = { activity: 'thinking', detail: '' };
      } else if (event.type === 'complete') {
        activities[role] = { activity: 'complete', detail: '' };
      } else if (event.type === 'error') {
        activities[role] = { activity: 'failed', detail: '' };
      } else if (event.type === 'status') {
        if (event.data.status?.includes('entering')) activities[role] = { activity: 'thinking', detail: 'Initializing...' };
        else if (event.data.status?.includes('completed')) activities[role] = { activity: 'complete', detail: '' };
      }
    }

    for (const role of Object.keys(AGENTS)) {
      const s = agentStatuses[role];
      if (s === 'pending') activities[role] = { activity: 'idle', detail: '' };
      if (s === 'completed') activities[role].activity = 'complete';
      if (s === 'failed') activities[role].activity = 'failed';
    }
    return activities;
  }, [events, agentStatuses]);

  // Sound effects — react to agent state transitions and skill/mcp events
  useEffect(() => {
    const prev = prevAgentStatesRef.current;
    for (const role of Object.keys(AGENTS)) {
      const cur = agentActivities[role]?.activity;
      const was = prev[role];
      if (!cur || cur === was) continue;
      // Agent just started (idle/pending → active state)
      if (was === 'idle' && cur !== 'idle' && cur !== 'complete' && cur !== 'failed') {
        playSfx('agent-activate.mp3', 0.3);
      }
      // Agent completed
      if (cur === 'complete' && was !== 'complete') {
        playSfx('agent-complete.mp3', 0.35);
      }
      prev[role] = cur;
    }

    // Check new events for skill/mcp invocations
    const newEvents = events.slice(prevEventCountRef.current);
    prevEventCountRef.current = events.length;
    for (const ev of newEvents) {
      if (ev.type === 'tool_use') {
        const tn = (ev.data.toolName || '').toLowerCase();
        if (tn === 'skill' || tn.startsWith('mcp__')) {
          playSfx('skill-invoked.mp3', 0.3);
          break; // one per poll cycle is enough
        }
      }
    }
  }, [agentActivities, events, playSfx]);

  // Track inter-agent communication: when one agent reads a file another wrote
  const agentConnections = useMemo(() => {
    const fileOwners: Record<string, string> = {}; // filePath -> agentRole that wrote it
    const connections: Array<{ from: string; to: string; file: string; timestamp: string }> = [];

    for (const event of events) {
      if (event.type !== 'tool_use' || !AGENTS[event.agentRole]) continue;
      const toolName = (event.data.toolName || '').toLowerCase();
      const filePath = event.data.filePath || (event.data.toolInput as Record<string, unknown>)?.file_path as string || '';
      if (!filePath) continue;
      const shortPath = filePath.split('/').pop() || '';

      if (toolName.includes('write') || toolName.includes('create')) {
        fileOwners[shortPath] = event.agentRole;
      } else if (toolName.includes('read') || toolName.includes('glob') || toolName.includes('grep')) {
        const owner = fileOwners[shortPath];
        if (owner && owner !== event.agentRole) {
          connections.push({ from: owner, to: event.agentRole, file: shortPath, timestamp: event.timestamp });
        }
      }
    }

    // Only keep last 4 connections for display to avoid label clutter
    return connections.slice(-4);
  }, [events]);

  // Which connections are "recent" (within last 10 seconds of latest event)
  const recentConnections = useMemo(() => {
    if (agentConnections.length === 0) return [];
    const latestTime = events.length > 0 ? new Date(events[events.length - 1].timestamp).getTime() : 0;
    return agentConnections.filter(c => latestTime - new Date(c.timestamp).getTime() < 10000);
  }, [agentConnections, events]);

  const commsEvents = events.filter(e => e.type === 'text' || e.type === 'status' || e.type === 'error' || e.type === 'complete');
  const toolEvents = events.filter(e => e.type === 'tool_use').slice(-30);

  // Extract product info from snapshot
  let productName = 'Dream Product';
  let productDescription = '';
  let productTagline = '';
  if (snapshot) {
    const forger = snapshot.agents.find(a => a.role === 'forger');
    if (forger?.output) {
      const allBold = [...forger.output.matchAll(/\*\*(.+?)\*\*/g)].map(m => m[1]);
      const skipLabels = ['product name', 'tagline', 'short pitch', 'tone', 'brand direction', 'voice', 'visual tone', 'copy style', 'emotional register'];
      const name = allBold.find(b => !skipLabels.includes(b.toLowerCase()));
      if (name) productName = name;
      const it = forger.output.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
      const qt = forger.output.match(/"(.+?)"/);
      productTagline = it?.[1] || qt?.[1] || '';
    }

    const translation = snapshot.translation;
    if (translation?.mappedMeanings) {
      const m = translation.mappedMeanings;
      const parts: string[] = [];
      if (m['the-mark']) parts.push(`Built for users who need ${m['the-mark']}.`);
      if (m['the-construct']) parts.push(`A ${m['the-construct'].split('/')[0].trim()} that`);
      if (m['the-desire']) {
        if (parts.length >= 2) {
          parts[parts.length - 1] += ` helps ${m['the-desire']}.`;
        } else {
          parts.push(`Designed to ${m['the-desire']}.`);
        }
      }
      if (m['the-distortion']) parts.push(`Key feature: ${m['the-distortion']}.`);
      if (m['the-rule']) parts.push(`The experience is ${m['the-rule']}.`);
      productDescription = parts.join(' ');
    }

    if (!productDescription && snapshot.translation?.formula) {
      productDescription = snapshot.translation.formula;
    }
  }

  const buildPath = buildDir ? buildDir.replace(/.*\/(builds\/)/, '$1') : null;

  // Fullscreen expand icon SVG
  const ExpandIcon = ({ expanded }: { expanded: boolean }) => expanded ? (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 1a.5.5 0 010 1H2.707l3.147 3.146a.5.5 0 11-.708.708L2 2.707V5.5a.5.5 0 01-1 0v-4a.5.5 0 01.5-.5h4zm5 0h4a.5.5 0 01.5.5v4a.5.5 0 01-1 0V2.707l-3.146 3.147a.5.5 0 11-.708-.708L13.293 2H10.5a.5.5 0 010-1zm-8.854 9.146a.5.5 0 01.708 0L5.5 13.293V10.5a.5.5 0 011 0v4a.5.5 0 01-.5.5h-4a.5.5 0 010-1h2.793L1.646 10.854a.5.5 0 010-.708zm12.708 0a.5.5 0 010 .708L11.207 14H14a.5.5 0 010 1h-4a.5.5 0 01-.5-.5v-4a.5.5 0 011 0v2.793l3.146-3.147a.5.5 0 01.708 0z"/></svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 1a.5.5 0 00-.5.5v4a.5.5 0 001 0V2.707l3.146 3.147a.5.5 0 10.708-.708L2.707 2H5.5a.5.5 0 000-1h-4zm13 0h-4a.5.5 0 000 1h2.793l-3.147 3.146a.5.5 0 00.708.708L14 2.707V5.5a.5.5 0 001 0v-4a.5.5 0 00-.5-.5zm-12.354 9.146a.5.5 0 00-.708.708L4.793 14H2a.5.5 0 000 1h4a.5.5 0 00.5-.5v-4a.5.5 0 00-1 0v2.793l-3.354-3.147zm12.708 0l-3.146 3.147V10.5a.5.5 0 00-1 0v4a.5.5 0 00.5.5h4a.5.5 0 000-1h-2.793l3.147-3.146a.5.5 0 00-.708-.708z"/></svg>
  );

  const fsBtn = (section: typeof fullscreen) => (
    <button
      onClick={() => setFullscreen(fullscreen === section ? null : section)}
      className="text-gray-600 hover:text-gray-300 transition-colors p-0.5"
      title={fullscreen === section ? 'Exit fullscreen' : 'Fullscreen'}
    >
      <ExpandIcon expanded={fullscreen === section} />
    </button>
  );

  // Is a section currently fullscreened?
  const isFs = (section: typeof fullscreen) => fullscreen === section;
  const anyFs = fullscreen !== null;

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-3 border-b border-gray-800/50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Image src="/dreamlab-icon.png" alt="Dream Lab" width={32} height={32} className="rounded" />
          <h1 className="text-lg font-bold tracking-wide">Dream Lab</h1>
          <div className="relative ml-2">
            <a
              href={`/dream-lab/${sessionId}/spec`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 text-sm cursor-pointer border-b border-dashed border-gray-700 hover:text-gray-200 hover:border-gray-500 transition-colors"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              title="Click to view full product spec (opens in new tab)"
            >
              Building: {productName}
              {productTagline && <span className="text-gray-600 ml-2 text-xs italic">{productTagline}</span>}
            </a>
            {showTooltip && (productDescription || productTagline) && (
              <div className="absolute top-full left-0 mt-2 w-[420px] p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">What&apos;s being built</div>
                {productTagline && <div className="text-sm text-white font-medium mb-2 italic">&ldquo;{productTagline}&rdquo;</div>}
                <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{productDescription}</div>
                {buildPath && (
                  <div className="mt-3 pt-2 border-t border-gray-800 text-xs text-gray-600 font-mono">Output: {buildPath}</div>
                )}
                <div className="mt-2 pt-2 border-t border-gray-800 text-[10px] text-gray-500 uppercase tracking-wider">Click to view full product spec (new tab)</div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-200 transition-colors p-1.5 rounded hover:bg-gray-800"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              {sidebarOpen ? (
                <path d="M11 1H5a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V3a2 2 0 00-2-2zm-6 1h2v12H5a1 1 0 01-1-1V3a1 1 0 011-1zm6 12H8V2h3a1 1 0 011 1v10a1 1 0 01-1 1z"/>
              ) : (
                <path d="M11 1H5a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V3a2 2 0 00-2-2zM4 3a1 1 0 011-1h6a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V3z"/>
              )}
            </svg>
          </button>
          {overallStatus === 'completed' && buildPath && (
            <button
              onClick={async () => {
                if (previewPort) {
                  window.open(`http://localhost:${previewPort}`, '_blank');
                  return;
                }
                setPreviewLoading(true);
                try {
                  const res = await fetch('/api/build', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, action: 'preview' }),
                  });
                  const data = await res.json();
                  if (data.port) {
                    setPreviewPort(data.port);
                    window.open(`http://localhost:${data.port}`, '_blank');
                  }
                } catch { /* ignore */ }
                setPreviewLoading(false);
              }}
              disabled={previewLoading}
              className="text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer bg-green-400/10 border-green-400/30 text-green-400 hover:bg-green-400/20 hover:border-green-400/50 disabled:opacity-50"
            >
              {previewLoading ? 'Starting server...' : previewPort ? `View Product :${previewPort}` : 'View Product'}
            </button>
          )}
          {overallStatus && (
            <span className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full ${
              overallStatus === 'running' ? 'bg-blue-900/50 text-blue-300' :
              overallStatus === 'completed' ? 'bg-green-900/50 text-green-300' :
              'bg-red-900/50 text-red-300'
            }`}>
              {overallStatus}
            </span>
          )}
        </div>
      </div>

      {/* Live Stats Bar */}
      {overallStatus && (
        <div className="px-6 py-1.5 border-b border-gray-800/30 flex items-center gap-6 shrink-0 bg-gray-950/50">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${overallStatus === 'running' ? 'bg-blue-400 animate-pulse' : overallStatus === 'completed' ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
              {overallStatus === 'running' ? 'Building' : overallStatus}
            </span>
          </div>
          <div className="flex items-center gap-5 text-[11px] text-gray-400 font-mono">
            <span>{Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}</span>
            <span>Files: <span className="text-gray-200">{buildStats.fileCount}</span></span>
            <span>LoC: <span className="text-gray-200">{buildStats.estimatedLoC.toLocaleString()}</span></span>
            <span>Agents: <span className="text-gray-200">{buildStats.completedAgents}/{buildStats.totalAgents}</span></span>
            {buildStats.totalCost > 0 && (
              <span>Cost: <span className="text-gray-200">${buildStats.totalCost.toFixed(2)}</span></span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                setMuted(!muted);
                if (muted && audioRef.current && overallStatus === 'running') {
                  audioRef.current.volume = 0.3;
                  audioRef.current.play().catch(() => {});
                }
              }}
              className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-800/50"
              title={muted ? 'Unmute music' : 'Mute music'}
            >
              {muted ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left column: Arena + Comms */}
        <div className={`flex-1 flex flex-col min-w-0 ${anyFs && !isFs('arena') && !isFs('comms') ? 'hidden' : ''}`}>

          {/* Agent Arena — Swimlane Board */}
          <div className={`relative overflow-hidden ${
            isFs('arena') ? 'flex-1' : anyFs && !isFs('arena') ? 'hidden' : 'flex-1 min-h-0'
          }`}>
            {/* Arena fullscreen button */}
            <div className="absolute top-2 right-2 z-20">{fsBtn('arena')}</div>

            {/* Phase column headers */}
            <div className="absolute top-0 left-0 right-0 h-7 flex items-end pointer-events-none z-10" style={{ paddingLeft: '14%' }}>
              {Object.entries(PHASE_COLUMNS).map(([, phase]) => (
                <div
                  key={phase.label}
                  className="absolute text-[11px] uppercase tracking-[0.15em] text-gray-600 font-medium"
                  style={{ left: `${phase.x}%`, transform: 'translateX(-50%)' }}
                >
                  {phase.label}
                </div>
              ))}
            </div>

            {/* SVG layer for column lines and connection arcs */}
            <div className="absolute inset-0" style={{ top: 28 }}>
              <svg className="w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
                {/* Vertical phase column dividers */}
                {[310, 510, 730].map(x => (
                  <line
                    key={x}
                    x1={x} y1={0} x2={x} y2={600}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="1"
                    strokeDasharray="3 6"
                  />
                ))}

                {/* Horizontal swim lane dividers */}
                {AGENT_ROW_ORDER.slice(0, -1).map((_, i) => {
                  const y = ((i + 1) / AGENT_ROW_ORDER.length) * 600;
                  return (
                    <line
                      key={`row-${i}`}
                      x1={130} y1={y} x2={960} y2={y}
                      stroke="rgba(255,255,255,0.03)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Connection arcs between agents */}
                {(() => {
                  const activeRoles = Object.entries(agentActivities)
                    .filter(([, a]) => a.activity !== 'idle' && a.activity !== 'complete' && a.activity !== 'failed')
                    .map(([role]) => role);
                  const rowCount = AGENT_ROW_ORDER.length;
                  const elements: React.ReactNode[] = [];

                  // Collect unique gradient pairs for defs
                  const gradients = new Map<string, { from: string; to: string }>();
                  for (const conn of recentConnections) {
                    const agentFrom = AGENTS[conn.from];
                    const agentTo = AGENTS[conn.to];
                    if (agentFrom && agentTo) {
                      const id = `grad-${conn.from}-${conn.to}`;
                      gradients.set(id, { from: agentFrom.color, to: agentTo.color });
                    }
                  }

                  // Single defs block for all gradients
                  if (gradients.size > 0) {
                    elements.push(
                      <defs key="conn-defs">
                        {Array.from(gradients.entries()).map(([id, colors]) => (
                          <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors.from} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={colors.to} stopOpacity="0.5" />
                          </linearGradient>
                        ))}
                      </defs>
                    );
                  }

                  // Subtle dashed lines between all simultaneously active agents
                  for (let i = 0; i < activeRoles.length; i++) {
                    for (let j = i + 1; j < activeRoles.length; j++) {
                      const rowA = AGENT_ROW_ORDER.indexOf(activeRoles[i]);
                      const rowB = AGENT_ROW_ORDER.indexOf(activeRoles[j]);
                      if (rowA < 0 || rowB < 0) continue;
                      const yA = ((rowA + 0.5) / rowCount) * 600;
                      const yB = ((rowB + 0.5) / rowCount) * 600;
                      const phaseA = activityToPhase(agentActivities[activeRoles[i]].activity);
                      const phaseB = activityToPhase(agentActivities[activeRoles[j]].activity);
                      const xA = PHASE_COLUMNS[phaseA].x * 10;
                      const xB = PHASE_COLUMNS[phaseB].x * 10;
                      // Curve control point to the right of both
                      const cpX = Math.max(xA, xB) + 40;
                      elements.push(
                        <path
                          key={`active-${activeRoles[i]}-${activeRoles[j]}`}
                          d={`M ${xA} ${yA} C ${cpX} ${yA}, ${cpX} ${yB}, ${xB} ${yB}`}
                          fill="none"
                          stroke="rgba(255,255,255,0.06)"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        >
                          <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1.5s" repeatCount="indefinite" />
                        </path>
                      );
                    }
                  }

                  // Highlighted arcs for file-based communication
                  for (let ci = 0; ci < recentConnections.length; ci++) {
                    const conn = recentConnections[ci];
                    const rowFrom = AGENT_ROW_ORDER.indexOf(conn.from);
                    const rowTo = AGENT_ROW_ORDER.indexOf(conn.to);
                    if (rowFrom < 0 || rowTo < 0) continue;
                    const agentFrom = AGENTS[conn.from];
                    if (!agentFrom || !AGENTS[conn.to]) continue;
                    const yFrom = ((rowFrom + 0.5) / rowCount) * 600;
                    const yTo = ((rowTo + 0.5) / rowCount) * 600;
                    const phaseFrom = activityToPhase(agentActivities[conn.from]?.activity || 'idle');
                    const phaseTo = activityToPhase(agentActivities[conn.to]?.activity || 'idle');
                    const xFrom = PHASE_COLUMNS[phaseFrom].x * 10;
                    const xTo = PHASE_COLUMNS[phaseTo].x * 10;
                    const cpX = Math.max(xFrom, xTo) + 50;
                    const gradId = `grad-${conn.from}-${conn.to}`;

                    elements.push(
                      <path
                        key={`conn-${ci}`}
                        d={`M ${xFrom} ${yFrom} C ${cpX} ${yFrom}, ${cpX} ${yTo}, ${xTo} ${yTo}`}
                        fill="none"
                        stroke={`url(#${gradId})`}
                        strokeWidth="1.5"
                      >
                        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
                      </path>
                    );

                    // File label at arc midpoint — stagger vertically to avoid overlap
                    const midY = (yFrom + yTo) / 2 + (ci % 3 - 1) * 14;
                    elements.push(
                      <text
                        key={`clabel-${ci}`}
                        x={cpX + 8}
                        y={midY}
                        fill="rgba(255,255,255,0.35)"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="start"
                        dominantBaseline="middle"
                      >
                        {conn.file.length > 20 ? conn.file.slice(0, 18) + '…' : conn.file}
                      </text>
                    );
                  }

                  return elements;
                })()}
              </svg>
            </div>

            {/* Agent swim lane rows */}
            <div className="absolute inset-0 flex flex-col" style={{ top: 28 }}>
              {AGENT_ROW_ORDER.map((role) => {
                const agent = AGENTS[role];
                if (!agent) return null;
                const act = agentActivities[role];
                const phase = activityToPhase(act.activity);
                const colX = PHASE_COLUMNS[phase].x;
                const isActive = act.activity !== 'idle' && act.activity !== 'complete' && act.activity !== 'failed';
                const isDone = act.activity === 'complete';
                const isFailed = act.activity === 'failed';
                const activeColor = isActive ? agent.color : isFailed ? '#ef4444' : isDone ? '#4ade80' : '#555';

                return (
                  <div key={role} className="flex-1 relative min-h-0">
                    {/* Agent label — fixed left side */}
                    <div className="absolute left-3 top-0 bottom-0 flex items-center gap-3 z-10" style={{ width: '14%' }}>
                      <TotemIcon role={role} size={36} color={activeColor} />
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate" style={{ color: activeColor }}>{agent.codename}</div>
                        <div className="text-[11px] text-gray-500 truncate">{agent.role_hint}</div>
                      </div>
                    </div>

                    {/* Track line — the path the agent travels */}
                    <div
                      className={`absolute top-1/2 transition-all duration-500 ${act.activity === 'skill' || act.activity === 'mcp' ? 'h-[2px]' : 'h-px'}`}
                      style={{
                        left: `${PHASE_COLUMNS.waiting.x}%`,
                        right: `${100 - PHASE_COLUMNS.complete.x}%`,
                        background: act.activity === 'skill'
                          ? 'rgba(251,191,36,0.15)'
                          : act.activity === 'mcp'
                          ? 'rgba(168,85,247,0.15)'
                          : 'rgba(255,255,255,0.04)',
                      }}
                    />

                    {/* Progress trail — filled portion of the track (slower than dot so dot arrives first) */}
                    {phase !== 'waiting' && (
                      <div
                        className={`absolute top-1/2 ${act.activity === 'skill' || act.activity === 'mcp' ? 'h-[2px]' : 'h-px'}`}
                        style={{
                          transition: 'width 1.8s ease-in-out, background 0.5s, opacity 0.5s',
                          left: `${PHASE_COLUMNS.waiting.x}%`,
                          width: `${colX - PHASE_COLUMNS.waiting.x}%`,
                          background: act.activity === 'skill'
                            ? `linear-gradient(to right, transparent, #fbbf24)`
                            : act.activity === 'mcp'
                            ? `linear-gradient(to right, transparent, #a855f7)`
                            : `linear-gradient(to right, transparent, ${activeColor})`,
                          opacity: act.activity === 'skill' || act.activity === 'mcp' ? 0.6 : 0.3,
                        }}
                      />
                    )}

                    {/* Agent indicator — moves to current phase column */}
                    <div
                      className="absolute top-1/2 flex flex-col items-center transition-all duration-1000 ease-in-out"
                      style={{
                        left: `${colX}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: isActive ? 10 : 5,
                      }}
                    >
                      {/* Glow for active agents — amplified for skill/MCP */}
                      {isActive && (
                        <>
                          <div
                            className="absolute rounded-full animate-ping"
                            style={{
                              width: act.activity === 'skill' || act.activity === 'mcp' ? 70 : 50,
                              height: act.activity === 'skill' || act.activity === 'mcp' ? 70 : 50,
                              background: act.activity === 'skill'
                                ? 'radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%)'
                                : act.activity === 'mcp'
                                ? 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)'
                                : `radial-gradient(circle, ${agent.glow} 0%, transparent 70%)`,
                              opacity: act.activity === 'skill' || act.activity === 'mcp' ? 0.5 : 0.3,
                              animationDuration: act.activity === 'skill' || act.activity === 'mcp' ? '1.5s' : '2.5s',
                            }}
                          />
                          {/* Second glow ring for skill/MCP */}
                          {(act.activity === 'skill' || act.activity === 'mcp') && (
                            <div
                              className="absolute rounded-full animate-pulse"
                              style={{
                                width: 40,
                                height: 40,
                                border: `1.5px solid ${act.activity === 'skill' ? 'rgba(251,191,36,0.4)' : 'rgba(168,85,247,0.4)'}`,
                                animationDuration: '1s',
                              }}
                            />
                          )}
                        </>
                      )}

                      {/* Dot indicator — color shifts for skill/MCP */}
                      <div
                        className={`relative rounded-full transition-all duration-700 ${(act.activity === 'skill' || act.activity === 'mcp') ? 'animate-pulse' : ''}`}
                        style={{
                          width: act.activity === 'skill' || act.activity === 'mcp' ? 18 : isActive ? 16 : 12,
                          height: act.activity === 'skill' || act.activity === 'mcp' ? 18 : isActive ? 16 : 12,
                          background: act.activity === 'skill' ? '#fbbf24' : act.activity === 'mcp' ? '#a855f7' : activeColor,
                          boxShadow: act.activity === 'skill'
                            ? '0 0 20px rgba(251,191,36,0.7), 0 0 8px rgba(251,191,36,0.5), 0 0 40px rgba(251,191,36,0.2)'
                            : act.activity === 'mcp'
                            ? '0 0 20px rgba(168,85,247,0.7), 0 0 8px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.2)'
                            : isActive ? `0 0 12px ${agent.color}, 0 0 4px ${agent.color}` : isDone ? '0 0 8px rgba(74,222,128,0.4)' : 'none',
                          opacity: act.activity === 'idle' ? 0.35 : 1,
                          animationDuration: '1.2s',
                        }}
                      />

                      {/* Status info below the dot */}
                      <div className="absolute top-full mt-1 flex flex-col items-center whitespace-nowrap">
                        {(isActive || isDone || isFailed) && (
                          <>
                            <div className={`inline-block text-[9px] px-1.5 py-0.5 rounded border ${MODEL_STYLES[agent.model]?.bg || ''} ${MODEL_STYLES[agent.model]?.badge || 'text-gray-500'}`}>
                              {MODEL_STYLES[agent.model]?.label || agent.model}
                            </div>
                            <div className="text-[10px] mt-0.5" style={{ color: isDone ? '#4ade80' : isFailed ? '#ef4444' : agent.color }}>
                              {ACTIVITY_LABELS[act.activity]}
                            </div>
                            {isFailed && (
                              <button
                                onClick={() => handleRestartAgent(role)}
                                disabled={restarting === role}
                                className="mt-1 text-[9px] px-2 py-0.5 rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {restarting === role ? 'Restarting...' : '↻ Restart'}
                              </button>
                            )}
                          </>
                        )}
                        {isActive && act.skillLabel && (
                          <div
                            className="text-[10px] mt-1 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse"
                            style={{
                              borderColor: act.activity === 'skill' ? 'rgba(251,191,36,0.6)' : 'rgba(168,85,247,0.6)',
                              border: `1px solid ${act.activity === 'skill' ? 'rgba(251,191,36,0.6)' : 'rgba(168,85,247,0.6)'}`,
                              background: act.activity === 'skill' ? 'rgba(251,191,36,0.18)' : 'rgba(168,85,247,0.18)',
                              color: act.activity === 'skill' ? '#fbbf24' : '#a855f7',
                              boxShadow: act.activity === 'skill'
                                ? '0 0 12px rgba(251,191,36,0.3)'
                                : '0 0 12px rgba(168,85,247,0.3)',
                              animationDuration: '1.5s',
                            }}
                          >
                            {act.skillLabel}
                          </div>
                        )}
                        {isActive && act.lastFile && (
                          <div
                            className="text-[9px] mt-0.5 px-1.5 py-0.5 rounded-full max-w-[120px] truncate font-mono"
                            style={{ background: agent.glow.replace('0.5', '0.1'), color: agent.color }}
                            title={act.lastFile}
                          >
                            {act.lastFile}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drag handle: Arena / Comms */}
          {!anyFs && (
            <div
              className="h-1.5 shrink-0 cursor-row-resize group flex items-center justify-center hover:bg-gray-700/30 transition-colors"
              onMouseDown={handleDragStart('comms', commsHeight)}
            >
              <div className="w-12 h-0.5 rounded bg-gray-700 group-hover:bg-gray-500 transition-colors" />
            </div>
          )}

          {/* Comms Feed */}
          <div className={`flex flex-col ${
            isFs('comms') ? 'flex-1' : anyFs && !isFs('comms') ? 'hidden' : 'shrink-0'
          }`} style={!anyFs ? { height: commsHeight } : undefined}>
            <div className="px-6 py-2 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Agent Comms</span>
              {fsBtn('comms')}
            </div>
            <div ref={commsRef} className="flex-1 overflow-y-auto px-6 pb-3 space-y-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {commsEvents.length === 0 && (
                <div className="text-gray-700 text-sm py-6 text-center">
                  {overallStatus ? 'Waiting for agent activity...' : 'Launch a build from the admin panel to see agents at work.'}
                </div>
              )}
              {commsEvents.map((event, i) => {
                const agent = AGENTS[event.agentRole];
                const color = agent?.color || '#888';
                const text = event.data.text || event.data.status || '';
                const displayText = text.length > 400 ? text.slice(0, 400) + '...' : text;
                return (
                  <div key={i} className="flex gap-3 group">
                    <div className="shrink-0 mt-0.5">
                      <TotemIcon role={event.agentRole} size={20} color={color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-sm" style={{ color }}>{event.agentCodename}</span>
                        <span className="text-xs text-gray-700">{new Date(event.timestamp).toLocaleTimeString()}</span>
                        {event.type === 'error' && <span className="text-xs text-red-500 font-medium">ERROR</span>}
                      </div>
                      <div className="text-sm text-gray-400 whitespace-pre-wrap break-words leading-relaxed">{displayText}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel — collapsible sidebar */}
        {(sidebarOpen || isFs('tools') || isFs('files') || isFs('preview')) && (
        <div className={`border-l border-gray-800/50 flex flex-col shrink-0 transition-all ${
          anyFs && (isFs('tools') || isFs('files') || isFs('preview')) ? 'flex-1' : anyFs ? 'hidden' : 'w-80'
        }`} data-right-panel>
          {/* Tool Activity */}
          <div className={`overflow-y-auto p-4 ${
            isFs('tools') ? 'flex-1' : isFs('files') || isFs('preview') ? 'hidden' : 'min-h-0'
          }`} style={!anyFs ? { height: `${rightToolHeight}%` } : undefined}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Tool Activity</span>
              {fsBtn('tools')}
            </div>
            <div className="space-y-1.5">
              {toolEvents.length === 0 && <div className="text-xs text-gray-700">No tool calls yet</div>}
              {toolEvents.slice(-25).map((event, i) => {
                const agent = AGENTS[event.agentRole];
                const color = agent?.color || '#888';
                const toolName = event.data.toolName || '';
                const input = (event.data.toolInput || {}) as Record<string, unknown>;
                const filePath = event.data.filePath || input.file_path as string || '';
                const shortPath = filePath ? filePath.split('/').slice(-2).join('/') : '';
                const extLabel = getSkillOrMcpLabel(toolName);

                // Build a meaningful description instead of just "Bash" or "Glob"
                let description = '';
                const tl = toolName.toLowerCase();
                if (tl === 'bash') {
                  const cmd = (input.command as string || '').replace(/^.*?builds\/session-[^/]+\/?/, '');
                  const short = cmd.length > 60 ? cmd.slice(0, 57) + '...' : cmd;
                  description = short || 'shell';
                } else if (tl === 'glob') {
                  description = (input.pattern as string) || 'search files';
                } else if (tl === 'grep') {
                  description = (input.pattern as string) ? `/${input.pattern}/ ` : 'search';
                } else if (tl === 'read') {
                  description = shortPath || 'read file';
                } else if (tl === 'write') {
                  description = shortPath ? `create ${shortPath}` : 'write file';
                } else if (tl === 'edit') {
                  description = shortPath ? `edit ${shortPath}` : 'edit file';
                } else if (extLabel) {
                  description = toolName.replace(/^(Skill|mcp__\w+__)/, '');
                } else {
                  description = shortPath || toolName;
                }

                // Skip events with no useful info at all
                if (!description && !shortPath && !extLabel) return null;

                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                    {extLabel ? (
                      <span
                        className="shrink-0 px-1 py-0 rounded text-[9px] font-bold uppercase"
                        style={{
                          background: isSkillCall(toolName) ? 'rgba(251,191,36,0.15)' : 'rgba(168,85,247,0.15)',
                          color: isSkillCall(toolName) ? '#fbbf24' : '#a855f7',
                        }}
                      >{extLabel}</span>
                    ) : null}
                    <span
                      className={`truncate ${filePath ? 'cursor-pointer hover:text-gray-300' : ''} text-gray-500`}
                      onClick={filePath ? () => setSelectedFile(filePath.replace(/^.*?builds\/session-[^/]+\//, '')) : undefined}
                    >
                      {description}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drag handle */}
          {!anyFs && (
            <div className="h-1.5 shrink-0 cursor-row-resize group flex items-center justify-center hover:bg-gray-700/30 transition-colors" onMouseDown={handleDragStart('right-tool', rightToolHeight)}>
              <div className="w-10 h-0.5 rounded bg-gray-700 group-hover:bg-gray-500 transition-colors" />
            </div>
          )}

          {/* File Tree */}
          <div className={`overflow-y-auto p-4 ${
            isFs('files') ? 'flex-1' : isFs('tools') || isFs('preview') ? 'hidden' : 'min-h-0'
          }`} style={!anyFs ? { height: `${rightFilesHeight}%` } : undefined}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Files ({files.length})</span>
              {fsBtn('files')}
            </div>
            <div className="space-y-0.5">
              {files.slice(0, 50).map(file => (
                <div
                  key={file.path}
                  onClick={() => setSelectedFile(file.path)}
                  className={`text-xs py-0.5 px-1 rounded cursor-pointer truncate ${
                    selectedFile === file.path ? 'bg-blue-900/30 text-blue-300' : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800/30'
                  }`}
                >{file.path}</div>
              ))}
              {files.length === 0 && <div className="text-xs text-gray-700">No files yet</div>}
            </div>
          </div>

          {/* Drag handle */}
          {!anyFs && (
            <div className="h-1.5 shrink-0 cursor-row-resize group flex items-center justify-center hover:bg-gray-700/30 transition-colors" onMouseDown={handleDragStart('right-files', rightFilesHeight)}>
              <div className="w-10 h-0.5 rounded bg-gray-700 group-hover:bg-gray-500 transition-colors" />
            </div>
          )}

          {/* File Preview */}
          <div className={`overflow-hidden flex flex-col ${
            isFs('preview') ? 'flex-1' : isFs('tools') || isFs('files') ? 'hidden' : 'flex-1 min-h-0'
          }`}>
            <div className="px-4 py-2 shrink-0 flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-bold truncate">
                {selectedFile ? selectedFile.split('/').pop() : 'File Preview'}
              </span>
              <div className="flex items-center gap-1">
                {selectedFile && (
                  <button onClick={() => setSelectedFile(null)} className="text-gray-600 hover:text-gray-400 text-xs px-1">x</button>
                )}
                {fsBtn('preview')}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {selectedFile ? (
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{fileContent}</pre>
              ) : (
                <div className="text-xs text-gray-700 text-center py-8">Click a file to preview</div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* "The Kick" — dramatic reveal overlay when build completes */}
      {showKickReveal && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black cursor-pointer"
          onClick={() => { setShowKickReveal(false); setKickDismissed(true); }}
          style={{ animation: 'kickFadeIn 1s ease-out' }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Converging lines animation */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{
                  width: '200vw',
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
                  opacity: 0,
                  animation: `kickFadeIn 0.5s ease-out ${0.3 + i * 0.05}s forwards`,
                }}
              />
            ))}
          </div>
          <div style={{ animation: 'kickTitle 1.5s ease-out 0.5s both' }}>
            <div className="text-sm text-gray-500 uppercase tracking-[0.3em] mb-4 text-center">The Dream is Real</div>
            <h1 className="text-7xl font-bold text-white mb-4 text-center">{productName}</h1>
            {productTagline && (
              <p className="text-2xl text-gray-400 italic text-center">&ldquo;{productTagline}&rdquo;</p>
            )}
          </div>
          <div className="mt-12 flex items-center gap-8" style={{ animation: 'kickTitle 1.5s ease-out 1s both' }}>
            {Object.entries(AGENTS).map(([role, agent]) => (
              <div key={role} className="flex flex-col items-center gap-2">
                <TotemIcon role={role} size={32} color="#4ade80" />
                <div className="text-[10px] text-gray-500">{agent.codename}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-xs text-gray-700" style={{ animation: 'kickTitle 1.5s ease-out 1.5s both' }}>
            {buildStats.fileCount} files created &middot; {buildStats.toolUseCount} tool calls{buildStats.totalCost > 0 ? ` \u00b7 $${buildStats.totalCost.toFixed(2)}` : ''}
          </div>
          <div className="mt-6 text-xs text-gray-600 animate-pulse" style={{ animation: 'kickTitle 1.5s ease-out 2s both' }}>
            Click anywhere to continue
          </div>
        </div>
      )}

      {/* Kick reveal CSS animations */}
      <style>{`
        @keyframes kickFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes kickTitle {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
