'use client';

import { useParams } from 'next/navigation';
import { useSession } from '@/lib/hooks';
import { useState, useEffect, useRef } from 'react';
import { QuestionKey } from '@/lib/types';

const QUESTION_ICONS: Record<QuestionKey, string> = {
  'the-mark': '/icons/the-mark.png',
  'the-desire': '/icons/the-desire.png',
  'the-construct': '/icons/the-construct.png',
  'the-distortion': '/icons/the-distortion.png',
  'the-rule': '/icons/the-rule.png',
};

const AGENT_META: Record<string, { codename: string; title: string; color: string }> = {
  extractor:  { codename: 'Cobb',    title: 'Product Analyst',      color: '#3b82f6' },
  forger:     { codename: 'Eames',   title: 'Brand Strategist',     color: '#a855f7' },
  architect:  { codename: 'Ariadne', title: 'Technical Architect',  color: '#06b6d4' },
  builder:    { codename: 'Yusuf',   title: 'Implementation Lead',  color: '#22c55e' },
  auditor:    { codename: 'Arthur',  title: 'Quality Reviewer',     color: '#f97316' },
};

function statusColor(role: string, status: string): string {
  if (status === 'completed') return '#4ade80';
  if (status === 'failed') return '#ef4444';
  if (status === 'active') return AGENT_META[role]?.color || '#3b82f6';
  if (status === 'queued') return '#fbbf24';
  return '#555';
}

export default function PresentPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { snapshot } = useSession(sessionId);
  const [agentMessages, setAgentMessages] = useState<Record<string, string>>({});
  const esRef = useRef<EventSource | null>(null);

  // Listen to SSE for real-time agent status messages
  useEffect(() => {
    if (!sessionId) return;

    const es = new EventSource(`/api/events/${sessionId}`);
    esRef.current = es;

    es.addEventListener('agent_status_changed', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.role && data.message) {
          setAgentMessages(prev => ({ ...prev, [data.role]: data.message }));
        }
      } catch { /* ignore */ }
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [sessionId]);

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const { session, questions, votes, agents, translation } = snapshot;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Created state - show QR
  if (session.state === 'created') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12">
        <h1 className="text-6xl font-bold mb-4 tracking-tight">Dream Heist</h1>
        <p className="text-2xl text-gray-400 mb-12">Scan to enter the dream</p>
        <QRCode size={400} />
        <p className="text-lg text-gray-500 font-mono mt-8">{origin}</p>
        <div className="mt-8 text-gray-600">{session.audienceCount} dreamer{session.audienceCount !== 1 ? 's' : ''} connected</div>
      </div>
    );
  }

  // Polling state - show QR + aggregate progress
  if (session.state === 'polling') {
    const totalVoters = session.audienceCount;
    const votesPerQuestion = questions.map(q => {
      const qVotes = votes[q.id] || {};
      return Object.values(qVotes).reduce((a, b) => a + b, 0);
    });
    const totalResponses = votesPerQuestion.reduce((a, b) => a + b, 0);

    return (
      <div className="min-h-screen bg-black text-white flex flex-col p-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dream Heist</h1>
            <p className="text-xl text-gray-500">5 layers. Vote on your phone.</p>
          </div>
          <QRCode size={150} />
        </div>

        {/* Question progress */}
        <div className="flex-1 grid grid-cols-5 gap-6">
          {questions.map((q, i) => {
            const qVotes = votes[q.id] || {};
            const total = votesPerQuestion[i];
            const sorted = q.options
              .map(o => ({ label: o.label, count: qVotes[o.id] || 0 }))
              .sort((a, b) => b.count - a.count);

            return (
              <div key={q.id} className="flex flex-col">
                <img
                  src={QUESTION_ICONS[q.key]}
                  alt={q.label}
                  className="w-10 h-10 object-contain mb-2"
                />
                <div className="text-sm text-gray-500 uppercase tracking-widest mb-2">{q.label}</div>
                <div className="text-lg font-semibold mb-1 text-gray-300">{q.prompt}</div>
                <div className="text-sm text-gray-600 mb-4">{total} responses</div>
                <div className="space-y-1 flex-1">
                  {sorted.map(opt => {
                    const pct = total > 0 ? Math.round((opt.count / total) * 100) : 0;
                    return (
                      <div key={opt.label} className="relative">
                        <div className="flex justify-between text-sm py-1 px-2 relative z-10">
                          <span className="text-gray-300 truncate">{opt.label}</span>
                          {total > 0 && <span className="text-gray-500 ml-2">{pct}%</span>}
                        </div>
                        {total > 0 && (
                          <div
                            className="absolute inset-0 bg-blue-900/20 rounded transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-center text-gray-600">
          <span>{totalVoters} dreamer{totalVoters !== 1 ? 's' : ''}</span>
          <span>{totalResponses} total responses</span>
        </div>
      </div>
    );
  }

  // Extracting - show results
  if (session.state === 'extracting' || session.state === 'revealing') {
    const winners = questions.filter(q => q.winnerLabel);
    const formulaText = translation?.formula || '';

    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12">
        <h2 className="text-2xl text-gray-500 mb-8 text-center">The Dream Chose</h2>
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {winners.map(q => (
            <div key={q.id} className="bg-gray-900 border border-gray-700 rounded-lg px-6 py-4 flex flex-col items-center">
              <img
                src={QUESTION_ICONS[q.key]}
                alt={q.label}
                className="w-8 h-8 object-contain mb-2"
              />
              <div className="text-xs text-gray-500 uppercase">{q.label}</div>
              <div className="text-xl font-bold text-blue-300">{q.winnerLabel}</div>
            </div>
          ))}
        </div>

        {formulaText && (
          <div className="max-w-4xl">
            <p className="text-3xl text-center leading-relaxed font-light italic text-gray-200">
              &ldquo;{formulaText}&rdquo;
            </p>
          </div>
        )}
      </div>
    );
  }

  // Orchestrating - show agents with totems and live status
  if (session.state === 'orchestrating') {
    const completedCount = agents.filter(a => a.status === 'completed').length;
    const totalAgents = agents.length || 5;

    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12">
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Agents at Work</h1>
        <p className="text-sm text-gray-600 mb-10">{completedCount} of {totalAgents} complete</p>

        {/* Progress bar */}
        <div className="w-full max-w-2xl h-1 bg-gray-900 rounded-full mb-12 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${(completedCount / totalAgents) * 100}%` }}
          />
        </div>

        <div className="w-full max-w-3xl space-y-3">
          {agents.map(agent => {
            const meta = AGENT_META[agent.role];
            if (!meta) return null;
            const color = statusColor(agent.role, agent.status);
            const isActive = agent.status === 'active';
            const isDone = agent.status === 'completed';
            const message = agentMessages[agent.role] || (
              isDone ? 'Complete' :
              isActive ? 'Working...' :
              agent.status === 'queued' ? 'Queued' : 'Waiting'
            );

            return (
              <div
                key={agent.role}
                className={`flex items-center gap-5 px-5 py-4 rounded-xl transition-all duration-500 ${
                  isActive ? 'bg-gray-900/80 border border-gray-700 scale-[1.02]' :
                  isDone ? 'bg-gray-900/40 border border-gray-800/50' :
                  agent.status === 'queued' ? 'bg-gray-900/30 border border-gray-800/30' :
                  'bg-gray-950/30 border border-transparent'
                }`}
              >
                {/* Totem */}
                <div className="shrink-0 relative">
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{
                        width: 48, height: 48,
                        background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
                        animationDuration: '2s',
                      }}
                    />
                  )}
                  <div style={{ filter: isActive ? `drop-shadow(0 0 8px ${color}80)` : 'none' }}>
                    <TotemIcon role={agent.role} size={44} color={color} />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-lg" style={{ color }}>{meta.codename}</span>
                    <span className="text-xs text-gray-600">{meta.title}</span>
                  </div>
                  <div className={`text-sm mt-0.5 transition-all ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>
                    {message}
                  </div>
                </div>

                {/* Status indicator */}
                <div className="shrink-0">
                  {isDone && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#4ade8030" stroke="#4ade80" strokeWidth="1.5" />
                      <path d="M8 12.5 L11 15.5 L16 9.5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isActive && (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{ background: color, boxShadow: `0 0 12px ${color}` }}
                      />
                    </div>
                  )}
                  {agent.status === 'queued' && (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Complete
  if (session.state === 'complete') {
    const forgerAgent = agents.find(a => a.role === 'forger');
    let productName = 'Dream Product';
    let tagline = '';
    if (forgerAgent?.output) {
      // Extract product name: look for **Name** after "Product Name" heading, or first bold that isn't a heading label
      const allBold = [...forgerAgent.output.matchAll(/\*\*(.+?)\*\*/g)].map(m => m[1]);
      const skipLabels = ['product name', 'tagline', 'short pitch', 'tone', 'brand direction', 'voice', 'visual tone', 'copy style', 'emotional register'];
      const name = allBold.find(b => !skipLabels.includes(b.toLowerCase()));
      if (name) productName = name;
      // Extract tagline: first italic text or quoted text
      // Match italic *text* but not bold **text** — require non-* before opening *
      const italicMatch = forgerAgent.output.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
      const quoteMatch = forgerAgent.output.match(/"(.+?)"/);
      tagline = italicMatch?.[1] || quoteMatch?.[1] || '';
    }

    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12">
        <div className="text-sm text-gray-500 uppercase tracking-widest mb-4">The Dream is Real</div>
        <h1 className="text-7xl font-bold mb-4">{productName}</h1>
        {tagline && <p className="text-2xl text-gray-400 italic mb-12">&ldquo;{tagline}&rdquo;</p>}

        <div className="flex gap-6">
          {agents.map(agent => {
            const meta = AGENT_META[agent.role];
            if (!meta) return null;
            return (
              <div key={agent.role} className="flex flex-col items-center gap-2">
                <TotemIcon role={agent.role} size={36} color="#4ade80" />
                <div className="text-xs text-gray-500">{meta.codename}</div>
                <div className="text-[10px] text-green-400 uppercase">Complete</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-400">Something went wrong. Check the admin panel.</p>
      </div>
    </div>
  );
}

function QRCode({ size = 300 }: { size?: number }) {
  return (
    <img
      src="/qr-code.png"
      alt="Scan to enter the dream"
      width={size}
      height={size}
      className="block rounded-xl"
    />
  );
}

// Totem SVG icons matching dream-lab
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
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="24" fill={color} opacity={0.3} />
        </svg>
      );
  }
}
