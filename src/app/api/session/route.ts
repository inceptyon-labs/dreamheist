import { NextRequest, NextResponse } from 'next/server';
import {
  createSession,
  getSession,
  updateSessionState,
  getQuestionResults,
  setQuestionWinner,
  getVoteCounts,
  resetSession,
  resetAgents,
  getSessionSnapshot,
  saveTranslation,
  getTranslation,
} from '@/lib/storage/db';
import { broadcast } from '@/lib/realtime/sse';
import { QUESTIONS } from '@/lib/questions';
import { translateWinners } from '@/lib/translation/translate';
import { runPipeline } from '@/lib/agents/pipeline';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('id');
  if (sessionId) {
    try {
      const snapshot = getSessionSnapshot(sessionId);
      if (!snapshot) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(snapshot);
    } catch (err) {
      console.error('Snapshot error:', err);
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }
  return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case 'create': {
      const session = createSession(body.title);
      return NextResponse.json(session);
    }

    case 'start-polling': {
      // Open voting - voters go at their own pace through all 5 questions
      const session = getSession(body.sessionId);
      if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      updateSessionState(body.sessionId, 'polling');
      broadcast(body.sessionId, {
        type: 'session_state_changed',
        data: { sessionId: body.sessionId, state: 'polling' },
      });

      return NextResponse.json({ state: 'polling' });
    }

    case 'close-polling': {
      // Close voting and determine winners for all questions
      const session = getSession(body.sessionId);
      if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const results: Record<string, { winnerId: string; winnerLabel: string; counts: Record<string, number> }> = {};

      for (const q of QUESTIONS) {
        const counts = getVoteCounts(body.sessionId, q.id);

        let winnerId: string;
        let winnerLabel: string;

        // Check for admin override
        const override = body.overrides?.[q.id];
        if (override) {
          winnerId = override;
          winnerLabel = q.options.find(o => o.id === override)?.label || '';
        } else {
          // Find winner with random tiebreak
          const sorted = q.options
            .map(o => ({ id: o.id, label: o.label, count: counts[o.id] || 0 }))
            .sort((a, b) => b.count - a.count);

          const maxCount = sorted[0]?.count || 0;
          if (maxCount === 0) {
            // No votes - pick random
            const rand = sorted[Math.floor(Math.random() * sorted.length)];
            winnerId = rand.id;
            winnerLabel = rand.label;
          } else {
            const tied = sorted.filter(o => o.count === maxCount);
            const winner = tied[Math.floor(Math.random() * tied.length)];
            winnerId = winner.id;
            winnerLabel = winner.label;
          }
        }

        setQuestionWinner(body.sessionId, q.id, winnerId, winnerLabel);
        results[q.id] = { winnerId, winnerLabel, counts };

        broadcast(body.sessionId, {
          type: 'winner_revealed',
          data: { sessionId: body.sessionId, questionId: q.id, winnerId, winnerLabel },
        });
      }

      // Also run extraction automatically
      const questionResults = getQuestionResults(body.sessionId);
      const translation = translateWinners(questionResults);
      saveTranslation(body.sessionId, translation);

      updateSessionState(body.sessionId, 'extracting');
      broadcast(body.sessionId, {
        type: 'session_state_changed',
        data: { sessionId: body.sessionId, state: 'extracting' },
      });

      return NextResponse.json({ results, translation });
    }

    case 'orchestrate': {
      const session = getSession(body.sessionId);
      if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const translation = getTranslation(body.sessionId);
      if (!translation) return NextResponse.json({ error: 'Run extraction first' }, { status: 400 });

      updateSessionState(body.sessionId, 'orchestrating');
      broadcast(body.sessionId, {
        type: 'session_state_changed',
        data: { sessionId: body.sessionId, state: 'orchestrating' },
      });

      // Run pipeline async (don't await - it broadcasts progress via SSE)
      runPipeline(body.sessionId, translation);

      return NextResponse.json({ state: 'orchestrating' });
    }

    case 'reset': {
      resetSession(body.sessionId);
      broadcast(body.sessionId, {
        type: 'session_state_changed',
        data: { sessionId: body.sessionId, state: 'created' },
      });
      return NextResponse.json({ reset: true });
    }

    case 'rerun-agent': {
      const translation = getTranslation(body.sessionId);
      if (!translation) return NextResponse.json({ error: 'No translation' }, { status: 400 });

      resetAgents(body.sessionId);
      updateSessionState(body.sessionId, 'orchestrating');
      broadcast(body.sessionId, {
        type: 'session_state_changed',
        data: { sessionId: body.sessionId, state: 'orchestrating' },
      });

      runPipeline(body.sessionId, translation);
      return NextResponse.json({ rerunning: true });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
