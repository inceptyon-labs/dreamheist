'use client';

import { useParams } from 'next/navigation';
import { useSession, useParticipantId } from '@/lib/hooks';
import { useState, useEffect, useCallback, useRef } from 'react';
import { QuestionKey } from '@/lib/types';

interface BuildEvent {
  timestamp: string;
  agentRole: string;
  agentCodename: string;
  type: 'text' | 'tool_use' | 'tool_result' | 'status' | 'error' | 'complete';
  data: { text?: string; toolName?: string; toolInput?: Record<string, unknown>; status?: string; filePath?: string; };
}

const AGENT_COLORS: Record<string, string> = {
  extractor: '#60a5fa',
  architect: '#22d3ee',
  forger: '#c084fc',
  builder: '#4ade80',
  shade: '#f87171',
  auditor: '#fb923c',
};

function formatBuildEvent(event: BuildEvent): string | null {
  const name = event.agentCodename;
  switch (event.type) {
    case 'tool_use': {
      const tl = (event.data.toolName || '').toLowerCase();
      const input = event.data.toolInput || {};
      const shortPath = (event.data.filePath || (input.file_path as string) || '').replace(/^.*?builds\/session-[^/]+\/?/, '').split('/').pop() || '';

      if (tl === 'bash') {
        const cmd = ((input.command as string) || '').replace(/^.*?builds\/session-[^/]+\/?/, '');
        const short = cmd.length > 50 ? cmd.slice(0, 47) + '...' : cmd;
        return `${name}: ${short || 'running command'}`;
      }
      if (tl === 'write') return `${name}: Creating ${shortPath || 'file'}`;
      if (tl === 'edit') return `${name}: Editing ${shortPath || 'file'}`;
      if (tl === 'read') return `${name}: Reading ${shortPath || 'file'}`;
      if (tl === 'glob') return `${name}: Searching ${(input.pattern as string) || 'files'}`;
      if (tl === 'grep') return `${name}: Searching for ${(input.pattern as string) || 'pattern'}`;
      if (tl === 'skill') return `${name}: Using skill ${(input.skill_name as string) || ''}`;
      if (tl.startsWith('mcp__')) {
        const parts = tl.split('__');
        return `${name}: Using ${parts.length >= 2 ? parts[1] : 'MCP'}`;
      }
      if (event.data.toolName) return `${name}: ${event.data.toolName}`;
      return `${name}: Working...`;
    }
    case 'status':
      return `${name} ${event.data.status || 'is active'}`;
    case 'text':
      if (event.data.text) {
        const trimmed = event.data.text.trim().replace(/\n/g, ' ');
        return `${name}: ${trimmed.length > 80 ? trimmed.slice(0, 77) + '...' : trimmed}`;
      }
      return null;
    case 'error':
      return `${name}: Error${event.data.text ? ' - ' + event.data.text.slice(0, 60) : ''}`;
    case 'complete':
      return `${name} has finished`;
    case 'tool_result':
      return null;
    default:
      return null;
  }
}

function BuildFeed({ sessionId, productName, tagline }: { sessionId: string; productName: string; tagline: string }) {
  const [feedItems, setFeedItems] = useState<Array<{ id: number; text: string; color: string; time: string }>>([]);
  const [buildStatus, setBuildStatus] = useState<string>('checking');
  const [fileCount, setFileCount] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  // Poll build status and file count
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const [statusRes, filesRes] = await Promise.all([
          fetch(`/api/build?sessionId=${sessionId}&action=status`),
          fetch(`/api/build?sessionId=${sessionId}&action=files`),
        ]);
        if (cancelled) return;
        const statusData = await statusRes.json();
        const filesData = await filesRes.json();
        if (statusData.status) setBuildStatus(statusData.status.status || 'idle');
        if (filesData.files) setFileCount(filesData.files.length);
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [sessionId]);

  // Listen for SSE build events
  useEffect(() => {
    const es = new EventSource(`/api/events/${sessionId}`);
    es.addEventListener('agent_status_changed', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.buildEvent) {
          const event = data.buildEvent as BuildEvent;
          const text = formatBuildEvent(event);
          if (text) {
            const color = AGENT_COLORS[event.agentRole] || '#9ca3af';
            const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setFeedItems(prev => {
              const next = [...prev, { id: idCounter.current++, text, color, time }];
              return next.slice(-15);
            });
          }
        }
      } catch { /* ignore */ }
    });
    return () => es.close();
  }, [sessionId]);

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [feedItems]);

  if (buildStatus === 'completed') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">&#10024;</div>
          <h1 className="text-2xl font-bold mb-2">{productName}</h1>
          {tagline && <p className="text-gray-400 italic mb-4">&ldquo;{tagline}&rdquo;</p>}
          <p className="text-green-400 font-medium mb-2">The dream is real.</p>
          <p className="text-gray-500 text-sm">{fileCount} files created</p>
        </div>
      </div>
    );
  }

  if (buildStatus === 'checking' || buildStatus === 'idle') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-2">{productName}</h1>
          {tagline && <p className="text-gray-400 italic mb-4">&ldquo;{tagline}&rdquo;</p>}
          <p className="text-gray-500 text-sm">Dream realized. Watch the main screen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col p-4">
      <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center pt-3 pb-4 border-b border-gray-800 mb-4">
          <h1 className="text-lg font-bold">{productName}</h1>
          {tagline && <p className="text-gray-500 text-xs italic mt-1">&ldquo;{tagline}&rdquo;</p>}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Building</span>
          </div>
          <span>{fileCount} file{fileCount !== 1 ? 's' : ''} created</span>
        </div>

        {/* Feed */}
        <div
          ref={feedRef}
          className="flex-1 overflow-y-auto space-y-2 min-h-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {feedItems.length === 0 && (
            <div className="text-center text-gray-600 text-sm py-8">Waiting for build events...</div>
          )}
          {feedItems.map(item => (
            <div key={item.id} className="flex items-start gap-2 text-sm">
              <span
                className="inline-block w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-300 leading-snug">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-xs pt-3 border-t border-gray-800 mt-3">
          Live build activity
        </div>
      </div>
    </div>
  );
}

const PIPELINE_AGENTS: Array<{ role: string; codename: string; title: string; color: string }> = [
  { role: 'extractor', codename: 'Cobb', title: 'Product Analyst', color: '#60a5fa' },
  { role: 'forger', codename: 'Eames', title: 'Brand Strategist', color: '#c084fc' },
  { role: 'architect', codename: 'Ariadne', title: 'Technical Architect', color: '#22d3ee' },
  { role: 'builder', codename: 'Yusuf', title: 'Implementation Lead', color: '#4ade80' },
  { role: 'auditor', codename: 'Arthur', title: 'Quality Reviewer', color: '#fb923c' },
];

function OrchestratingView({ agents }: { agents: Array<{ role: string; status: string; output?: string | null }> }) {
  const completedCount = agents.filter(a => a.status === 'completed').length;
  const totalAgents = agents.length || 5;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold mb-1 text-center">Agents at Work</h1>
        <p className="text-xs text-gray-600 mb-5 text-center">{completedCount} of {totalAgents} complete</p>

        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-800 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${(completedCount / totalAgents) * 100}%` }}
          />
        </div>

        <div className="space-y-2">
          {PIPELINE_AGENTS.map(meta => {
            const agent = agents.find(a => a.role === meta.role);
            const status = agent?.status || 'pending';
            const isActive = status === 'active';
            const isDone = status === 'completed';
            const isQueued = status === 'queued';
            const color = isDone ? '#4ade80' : isActive ? meta.color : isQueued ? '#fbbf24' : '#555';

            return (
              <div
                key={meta.role}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-500 ${
                  isActive ? 'bg-gray-900/80 border border-gray-700' :
                  isDone ? 'bg-gray-900/40 border border-gray-800/50' :
                  isQueued ? 'bg-gray-900/30 border border-gray-800/30' :
                  'bg-gray-950/30 border border-transparent'
                }`}
              >
                {/* Status dot */}
                <div className="shrink-0 relative">
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ width: 12, height: 12, background: `${meta.color}40`, animationDuration: '2s' }}
                    />
                  )}
                  <div
                    className={`w-3 h-3 rounded-full transition-all ${isActive ? 'animate-pulse' : ''}`}
                    style={{ background: color, boxShadow: isActive ? `0 0 8px ${meta.color}` : 'none' }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-sm" style={{ color }}>{meta.codename}</span>
                    <span className="text-[10px] text-gray-600">{meta.title}</span>
                  </div>
                  <div className={`text-xs mt-0.5 ${isActive ? 'text-gray-400' : 'text-gray-700'}`}>
                    {isDone ? 'Complete' : isActive ? 'Working...' : isQueued ? 'Queued' : 'Waiting'}
                  </div>
                </div>

                {/* Check mark */}
                {isDone && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <circle cx="12" cy="12" r="10" fill="#4ade8030" stroke="#4ade80" strokeWidth="1.5" />
                    <path d="M8 12.5 L11 15.5 L16 9.5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-600 text-center mt-6">Stay here to watch the live build next</p>
      </div>
    </div>
  );
}

const QUESTION_ICONS: Record<QuestionKey, string> = {
  'the-mark': '/icons/the-mark.png',
  'the-desire': '/icons/the-desire.png',
  'the-construct': '/icons/the-construct.png',
  'the-distortion': '/icons/the-distortion.png',
  'the-rule': '/icons/the-rule.png',
};

export default function JoinPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { snapshot } = useSession(sessionId);
  const participantId = useParticipantId();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, string>>({}); // questionId -> optionId
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Load any existing votes from server on mount
  useEffect(() => {
    if (!participantId || !snapshot) return;
    let cancelled = false;

    async function loadExistingVotes() {
      const existing: Record<string, string> = {};
      for (const q of snapshot!.questions) {
        try {
          const res = await fetch(`/api/vote?sessionId=${sessionId}&questionId=${q.id}&participantId=${participantId}`);
          const data = await res.json();
          if (data.myVote) existing[q.id] = data.myVote;
        } catch { /* ignore */ }
      }
      if (cancelled) return;
      if (Object.keys(existing).length > 0) {
        setVotes(existing);
        // Jump to first unanswered question or mark done
        const firstUnanswered = snapshot!.questions.findIndex(q => !existing[q.id]);
        if (firstUnanswered === -1) {
          setDone(true);
        } else {
          setCurrentIndex(firstUnanswered);
        }
      }
    }

    loadExistingVotes();
    return () => { cancelled = true; };
  }, [participantId, sessionId, snapshot?.session.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVote = useCallback(async (questionId: string, optionId: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId, participantId, optionId }),
      });
      if (res.ok) {
        setVotes(prev => ({ ...prev, [questionId]: optionId }));
        // Auto-advance after a short delay
        setTimeout(() => {
          if (currentIndex < 4) {
            setCurrentIndex(prev => prev + 1);
          } else {
            setDone(true);
          }
        }, 400);
      }
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, participantId, submitting, currentIndex]);

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Entering the dream...</div>
      </div>
    );
  }

  const { session, questions } = snapshot;

  // Pre-polling state
  if (session.state === 'created') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-2">Dream Heist</h1>
          <p className="text-gray-400 mb-6">You&apos;ve entered the dream. Waiting for the session to begin...</p>
          <div className="w-12 h-12 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Post-poll states (extracting, orchestrating, complete)
  if (session.state === 'orchestrating') {
    return <OrchestratingView agents={snapshot.agents} />;
  }

  if (session.state === 'complete') {
    const forgerAgent = snapshot.agents.find(a => a.role === 'forger');
    let productName = 'Your Dream Product';
    let tagline = '';
    if (forgerAgent?.output) {
      const nameMatch = forgerAgent.output.match(/\*\*(.+?)\*\*/);
      if (nameMatch) productName = nameMatch[1];
      const taglineMatch = forgerAgent.output.match(/"(.+?)"/);
      if (taglineMatch) tagline = taglineMatch[1];
    }
    return <BuildFeed sessionId={sessionId} productName={productName} tagline={tagline} />;
  }

  // Extracting - show results
  if (session.state === 'extracting' || session.state === 'revealing') {
    const winners = questions.filter(q => q.winnerLabel);
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold mb-4">Dream Complete</h1>
          <p className="text-gray-400 mb-6">Watch the main screen for the reveal.</p>
          <div className="space-y-3 text-left">
            {winners.map(q => (
              <div key={q.id} className="bg-gray-900 rounded-lg p-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide">{q.label}</div>
                <div className="text-white font-medium">{q.winnerLabel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Polling state - self-paced voting
  if (session.state === 'polling') {
    // Done voting - waiting for presenter to close polling
    if (done) {
      return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <h1 className="text-xl font-bold mb-4">Dream Layers Complete</h1>
            <p className="text-gray-400 mb-4">Your choices have been recorded.</p>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 mb-6">
              <p className="text-sm text-gray-300">Stay on this page to follow along as AI agents build your product live.</p>
            </div>
            <div className="space-y-2 text-left">
              {questions.map((q, i) => {
                const myVote = votes[q.id];
                const option = q.options.find(o => o.id === myVote);
                return (
                  <div key={q.id} className="flex items-center gap-3 p-2 bg-gray-900 rounded-lg">
                    <div className="text-xs text-gray-500 w-24 shrink-0">{q.label}</div>
                    <div className="text-sm text-blue-300">{option?.label || '---'}</div>
                    <button
                      onClick={() => { setDone(false); setCurrentIndex(i); }}
                      className="ml-auto text-xs text-gray-600 hover:text-gray-400"
                    >
                      change
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    const currentQ = questions[currentIndex];
    const myVote = votes[currentQ.id];

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col p-6">
        <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6 pt-4">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-blue-400' :
                  votes[questions[i].id] ? 'bg-blue-700' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Layer indicator */}
          <div className="text-center mb-6">
            <img
              src={QUESTION_ICONS[currentQ.key]}
              alt={currentQ.label}
              className="w-16 h-16 mx-auto mb-3 object-contain"
            />
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">
              Layer {currentIndex + 1} of 5
            </div>
            <h2 className="text-lg font-bold text-blue-400">{currentQ.label}</h2>
          </div>

          {/* Question */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold">{currentQ.prompt}</h1>
          </div>

          {/* Options */}
          <div className="space-y-3 flex-1">
            {currentQ.options.map(option => {
              const isSelected = myVote === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleVote(currentQ.id, option.id)}
                  disabled={submitting}
                  className={`w-full p-4 rounded-xl text-left text-lg font-medium transition-all
                    ${isSelected
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-gray-900 text-gray-200 hover:bg-gray-800 active:bg-gray-700'
                    }
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6 pt-4">
            <button
              onClick={() => setCurrentIndex(prev => prev - 1)}
              disabled={currentIndex === 0}
              className="text-sm text-gray-500 hover:text-gray-300 disabled:invisible"
            >
              Back
            </button>
            {myVote && currentIndex < 4 && (
              <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Next
              </button>
            )}
            {myVote && currentIndex === 4 && (
              <button
                onClick={() => setDone(true)}
                className="text-sm text-green-400 hover:text-green-300"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="text-gray-400">Waiting...</div>
    </div>
  );
}
