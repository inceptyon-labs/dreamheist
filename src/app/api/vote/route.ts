import { NextRequest, NextResponse } from 'next/server';
import { castVote, getSession, getVoteCounts, getParticipantVote, registerParticipant, getTotalVoteCount } from '@/lib/storage/db';
import { broadcast } from '@/lib/realtime/sse';
import { QUESTIONS } from '@/lib/questions';

export async function POST(req: NextRequest) {
  const { sessionId, questionId, participantId, optionId } = await req.json();

  if (!sessionId || !questionId || !participantId || !optionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (session.state !== 'polling') return NextResponse.json({ error: 'Not in polling state' }, { status: 400 });

  // Voters can vote on any of the 5 questions at their own pace
  const q = QUESTIONS.find(q => q.id === questionId);
  if (!q) return NextResponse.json({ error: 'Unknown question' }, { status: 400 });

  if (!q.options.find(o => o.id === optionId)) {
    return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
  }

  registerParticipant(sessionId, participantId);
  castVote(sessionId, questionId, participantId, optionId);

  const voteCount = getTotalVoteCount(sessionId, questionId);

  broadcast(sessionId, {
    type: 'vote_cast',
    data: { sessionId, questionId, voteCount },
  });

  return NextResponse.json({ success: true, voteCount });
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  const questionId = req.nextUrl.searchParams.get('questionId');
  const participantId = req.nextUrl.searchParams.get('participantId');

  if (!sessionId || !questionId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const counts = getVoteCounts(sessionId, questionId);
  const myVote = participantId ? getParticipantVote(sessionId, questionId, participantId) : null;

  return NextResponse.json({ counts, myVote });
}
