'use client';

import { useParams } from 'next/navigation';
import { useSession } from '@/lib/hooks';
import { useState, useEffect, useRef } from 'react';

const AGENT_META: Record<string, { label: string; color: string }> = {
  extractor: { label: 'Cobb - Product Analyst',      color: '#3b82f6' },
  forger:    { label: 'Eames - Brand Strategist',     color: '#a855f7' },
  architect: { label: 'Ariadne - Technical Architect', color: '#06b6d4' },
  builder:   { label: 'Yusuf - Implementation Lead',  color: '#22c55e' },
  auditor:   { label: 'Arthur - Quality Reviewer',    color: '#f97316' },
  shade:     { label: 'Mal - Test Engineer',           color: '#ef4444' },
};

function agentColor(role: string, status: string): string {
  if (status === 'completed') return '#4ade80';
  if (status === 'failed') return '#ef4444';
  if (status === 'active') return AGENT_META[role]?.color || '#3b82f6';
  if (status === 'queued') return '#fbbf24';
  return '#555';
}

export default function AdminPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { snapshot, connected, refetch } = useSession(sessionId);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [writeResult, setWriteResult] = useState<{ directory?: string; files?: string[] } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [agentMessages, setAgentMessages] = useState<Record<string, string>>({});
  const esRef = useRef<EventSource | null>(null);

  // SSE listener for real-time agent status messages
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
    return () => { es.close(); esRef.current = null; };
  }, [sessionId]);

  async function doAction(action: string, extra?: Record<string, unknown>) {
    setLoading(action);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, sessionId, ...extra }),
      });
      const data = await res.json();
      setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${action}: ${JSON.stringify(data).slice(0, 100)}`, ...prev.slice(0, 49)]);
      refetch();
      return data;
    } catch (err) {
      setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${action} FAILED: ${err}`, ...prev.slice(0, 49)]);
    } finally {
      setLoading(null);
    }
  }

  async function writeArtifacts() {
    setLoading('write');
    try {
      const res = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action: 'write-to-disk' }),
      });
      const data = await res.json();
      setWriteResult(data);
      setActionLog(prev => [`[${new Date().toLocaleTimeString()}] write-to-disk: ${data.files?.length || 0} files`, ...prev.slice(0, 49)]);
    } finally {
      setLoading(null);
    }
  }

  async function copyToClipboard(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2000);
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <h1 className="text-xl font-bold">Loading admin panel...</h1>
      </div>
    );
  }

  const { session, questions, votes, agents, translation } = snapshot;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Compute total unique voters
  const totalVoters = session.audienceCount;

  // Compute per-question completion
  const questionStats = questions.map(q => {
    const qVotes = votes[q.id] || {};
    const totalForQ = Object.values(qVotes).reduce((a, b) => a + b, 0);
    const sorted = q.options
      .map(o => ({ id: o.id, label: o.label, count: qVotes[o.id] || 0 }))
      .sort((a, b) => b.count - a.count);
    const maxCount = sorted[0]?.count || 0;
    const tied = maxCount > 0 ? sorted.filter(o => o.count === maxCount) : [];
    return { question: q, totalVotes: totalForQ, sorted, tied, hasTie: tied.length > 1 };
  });

  // How many people have completed all 5 questions
  // (approximated by min votes across all questions)
  const votesPerQuestion = questionStats.map(qs => qs.totalVotes);
  const minCompleted = Math.min(...votesPerQuestion);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dream Heist Control</h1>
            <div className="text-sm text-gray-500">Session: {sessionId}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs text-gray-500 uppercase tracking-wide px-3 py-1 bg-gray-800 rounded-full">
              {session.state}
            </span>
          </div>
        </div>

        {/* URLs */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6 space-y-1 text-sm font-mono">
          <div><span className="text-gray-500">Join:</span> <a href={`${origin}/join/${sessionId}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{origin}/join/{sessionId}</a></div>
          <div><span className="text-gray-500">Present:</span> <a href={`${origin}/present/${sessionId}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{origin}/present/{sessionId}</a></div>
          <div><span className="text-gray-500">Dream Lab:</span> <a href={`${origin}/dream-lab/${sessionId}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{origin}/dream-lab/{sessionId}</a></div>
          <div className="text-gray-600">Audience: {totalVoters}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Polling Controls */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h2 className="text-lg font-bold mb-4">Polling</h2>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {session.state === 'created' && (
                  <ActionBtn
                    onClick={() => doAction('start-polling')}
                    loading={loading === 'start-polling'}
                    label="Open Polling"
                    className="bg-blue-600 hover:bg-blue-700"
                  />
                )}

                {session.state === 'polling' && (
                  <ActionBtn
                    onClick={() => doAction('close-polling')}
                    loading={loading === 'close-polling'}
                    label="Close Polling & Determine Winners"
                    className="bg-green-600 hover:bg-green-700"
                  />
                )}
              </div>

              {/* Live vote counts per question */}
              {(session.state === 'polling' || session.state === 'created') && (
                <div className="space-y-3">
                  {questionStats.map(qs => (
                    <div key={qs.question.id} className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="text-xs text-gray-500 uppercase">{qs.question.label}</span>
                          <span className="text-xs text-gray-600 ml-2">{qs.question.prompt}</span>
                        </div>
                        <span className="text-sm text-gray-400">{qs.totalVotes} votes</span>
                      </div>
                      {qs.totalVotes > 0 && (
                        <div className="space-y-1">
                          {qs.sorted.map(opt => {
                            const pct = qs.totalVotes > 0 ? Math.round((opt.count / qs.totalVotes) * 100) : 0;
                            return (
                              <div key={opt.id} className="flex items-center gap-2 text-xs">
                                <span className="w-28 truncate text-gray-300">{opt.label}</span>
                                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-600 rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-gray-500 w-12 text-right">{opt.count} ({pct}%)</span>
                              </div>
                            );
                          })}
                          {qs.hasTie && (
                            <div className="text-yellow-400 text-xs mt-1">Tie - will be broken randomly (or override below)</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {session.state === 'polling' && (
                    <div className="text-xs text-gray-600">
                      ~{minCompleted} of {totalVoters} completed all 5 layers
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Results & Extraction */}
            {(session.state === 'extracting' || session.state === 'orchestrating' || session.state === 'complete' || session.state === 'error') && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-bold mb-4">Results & Orchestration</h2>

                {translation && (
                  <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Translation Formula</div>
                    <div className="text-sm italic text-gray-300">{translation.formula}</div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {session.state === 'extracting' && (
                    <ActionBtn
                      onClick={() => doAction('orchestrate')}
                      loading={loading === 'orchestrate'}
                      label="Start Orchestration"
                      className="bg-indigo-600 hover:bg-indigo-700"
                    />
                  )}

                  {(session.state === 'complete' || session.state === 'error') && (
                    <ActionBtn
                      onClick={() => doAction('rerun-agent')}
                      loading={loading === 'rerun-agent'}
                      label="Rerun Pipeline"
                      className="bg-orange-600 hover:bg-orange-700"
                    />
                  )}
                </div>

                {/* Agent Status */}
                {agents.length > 0 && (
                  <div className="space-y-2">
                    {agents.map(agent => {
                      const meta = AGENT_META[agent.role];
                      const color = agentColor(agent.role, agent.status);
                      const isActive = agent.status === 'active';
                      const msg = agentMessages[agent.role];
                      return (
                        <div key={agent.role} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm transition-all ${
                          isActive ? 'bg-gray-800/80 border border-gray-700' : 'bg-gray-800/50 border border-transparent'
                        }`}>
                          <div className="shrink-0" style={{ filter: isActive ? `drop-shadow(0 0 6px ${color}80)` : 'none' }}>
                            <TotemIcon role={agent.role} size={28} color={color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium" style={{ color }}>{meta?.label || agent.role}</div>
                            {msg && (
                              <div className="text-xs text-gray-500 truncate">{msg}</div>
                            )}
                          </div>
                          <span className="text-xs text-gray-600 shrink-0">{agent.status}</span>
                          {agent.output && (
                            <button
                              onClick={() => copyToClipboard(agent.output!, agent.role)}
                              className="text-xs text-blue-400 hover:text-blue-300 shrink-0"
                            >
                              {copyFeedback === agent.role ? 'Copied!' : 'Copy'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Artifacts & Export */}
            {session.state === 'complete' && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-bold mb-4">Artifacts & Export</h2>

                <div className="flex flex-wrap gap-2 mb-4">
                  <ActionBtn
                    onClick={writeArtifacts}
                    loading={loading === 'write'}
                    label="Write to Disk"
                    className="bg-green-600 hover:bg-green-700"
                  />
                  <ActionBtn
                    onClick={() => {
                      const masterArtifact = snapshot.artifacts.find(a => a.artifactType === 'master');
                      if (masterArtifact) copyToClipboard(masterArtifact.content, 'master');
                    }}
                    label={copyFeedback === 'master' ? 'Copied!' : 'Copy Master Prompt'}
                    className="bg-blue-600 hover:bg-blue-700"
                  />
                </div>

                {writeResult && (
                  <div className="p-3 bg-gray-800 rounded-lg text-sm">
                    <div className="text-green-400 mb-1">Written to: {writeResult.directory}</div>
                    <div className="text-gray-500">{writeResult.files?.length} files</div>
                  </div>
                )}

                {/* Agent outputs preview */}
                <div className="mt-4 space-y-3">
                  {agents.filter(a => a.output).map(agent => (
                    <details key={agent.role} className="bg-gray-800/50 rounded-lg">
                      <summary className="p-3 cursor-pointer font-medium text-sm">
                        {AGENT_META[agent.role]?.label || agent.role}
                      </summary>
                      <div className="p-3 pt-0 text-xs text-gray-400 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                        {agent.output}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Launch Build */}
            {session.state === 'complete' && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-bold mb-4">Launch Build</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Send the generated artifacts to Claude Code agents. Each agent (Cobb, Ariadne, Eames, Yusuf, Arthur) will work on their part of the build. Watch progress in Dream Lab.
                </p>
                <div className="flex flex-wrap gap-2">
                  <ActionBtn
                    onClick={async () => {
                      setLoading('launch-build');
                      try {
                        const res = await fetch('/api/build', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ sessionId, action: 'launch' }),
                        });
                        const data = await res.json();
                        setActionLog(prev => [`[${new Date().toLocaleTimeString()}] launch-build: ${JSON.stringify(data).slice(0, 100)}`, ...prev.slice(0, 49)]);
                      } finally {
                        setLoading(null);
                      }
                    }}
                    loading={loading === 'launch-build'}
                    label="Launch Build Agents"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  />
                  <a
                    href={`/dream-lab/${sessionId}`}
                    target="_blank"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    Open Dream Lab
                  </a>
                </div>
              </div>
            )}

            {/* Reset */}
            <div className="bg-gray-900 rounded-lg p-4">
              <ActionBtn
                onClick={() => {
                  if (confirm('Reset entire session? This clears all votes and agent outputs.')) {
                    doAction('reset');
                  }
                }}
                label="Reset Session"
                className="bg-red-800 hover:bg-red-700"
              />
            </div>
          </div>

          {/* Right: Results & Log */}
          <div className="space-y-6">
            {/* Question Winners */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-400 mb-3">Dream Layers</h3>
              <div className="space-y-2">
                {questions.map(q => {
                  const qVotes = votes[q.id] || {};
                  const totalForQ = Object.values(qVotes).reduce((a, b) => a + b, 0);
                  return (
                    <div key={q.id} className="p-2 rounded text-sm bg-gray-800">
                      <div className="text-xs text-gray-500">{q.label}</div>
                      <div className={q.winnerLabel ? 'text-blue-300 font-medium' : 'text-gray-600'}>
                        {q.winnerLabel || `${totalForQ} votes`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Log */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-400 mb-3">Event Log</h3>
              <div className="space-y-1 text-xs text-gray-500 max-h-80 overflow-y-auto font-mono">
                {actionLog.length === 0 && <div className="text-gray-700">No events yet</div>}
                {actionLog.map((entry, i) => (
                  <div key={i}>{entry}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  onClick,
  loading,
  label,
  className = '',
}: {
  onClick: () => void;
  loading?: boolean;
  label: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading === true}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? 'Working...' : label}
    </button>
  );
}

function TotemIcon({ role, size = 28, color }: { role: string; size?: number; color: string }) {
  const s = size;
  switch (role) {
    case 'extractor':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <rect x="29" y="8" width="6" height="12" rx="2" fill={color} />
          <path d="M16 28 L48 28 L34 54 Q32 58 30 54 Z" fill={color} opacity={0.85} />
          <ellipse cx="32" cy="28" rx="18" ry="5" fill={color} opacity={0.6} />
          <circle cx="32" cy="55" r="2" fill={color} />
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
          <rect x="20" y="52" width="24" height="4" rx="2" fill={color} opacity={0.85} />
          <rect x="27" y="30" width="10" height="22" rx="2" fill={color} opacity={0.8} />
          <path d="M24 28 Q24 14 32 8 Q40 14 40 28 Z" fill={color} opacity={0.85} />
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
        </svg>
      );
    case 'builder':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
          <rect x="26" y="6" width="12" height="14" rx="3" fill="none" stroke={color} strokeWidth="2" />
          <rect x="24" y="4" width="16" height="4" rx="2" fill={color} opacity={0.7} />
          <path d="M26 20 L20 38 Q18 48 24 54 L40 54 Q46 48 44 38 L38 20 Z" fill="none" stroke={color} strokeWidth="2" />
          <path d="M22 40 Q20 48 25 52 L39 52 Q44 48 42 40 Z" fill={color} opacity={0.5} />
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
