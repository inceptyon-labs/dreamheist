import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Session, SessionState, AgentRole, AgentStatus, AgentRun, ArtifactRecord, QuestionKey } from '../types';
import { QUESTIONS } from '../questions';

const DB_PATH = path.join(process.cwd(), 'dreamheist.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initDb(db);
  }
  return db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      createdAt TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'Dream Heist',
      state TEXT NOT NULL DEFAULT 'created',
      currentQuestionIndex INTEGER NOT NULL DEFAULT -1,
      votingLocked INTEGER NOT NULL DEFAULT 0,
      audienceCount INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS question_results (
      sessionId TEXT NOT NULL,
      questionId TEXT NOT NULL,
      winnerId TEXT,
      winnerLabel TEXT,
      PRIMARY KEY (sessionId, questionId)
    );

    CREATE TABLE IF NOT EXISTS votes (
      sessionId TEXT NOT NULL,
      questionId TEXT NOT NULL,
      participantId TEXT NOT NULL,
      selectedOptionId TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      PRIMARY KEY (sessionId, questionId, participantId)
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle',
      startedAt TEXT,
      completedAt TEXT,
      input TEXT,
      output TEXT
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      sessionId TEXT NOT NULL,
      role TEXT NOT NULL,
      artifactType TEXT NOT NULL,
      content TEXT NOT NULL,
      filePath TEXT,
      PRIMARY KEY (sessionId, role, artifactType)
    );

    CREATE TABLE IF NOT EXISTS translation_results (
      sessionId TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS participants (
      sessionId TEXT NOT NULL,
      participantId TEXT NOT NULL,
      joinedAt TEXT NOT NULL,
      PRIMARY KEY (sessionId, participantId)
    );

    CREATE TABLE IF NOT EXISTS build_state (
      sessionId TEXT PRIMARY KEY,
      buildDir TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running'
    );

    CREATE TABLE IF NOT EXISTS build_agents (
      sessionId TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      PRIMARY KEY (sessionId, role)
    );

    CREATE TABLE IF NOT EXISTS build_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      agentRole TEXT NOT NULL,
      agentCodename TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_build_events_session ON build_events(sessionId);
  `);
}

// Session operations
export function createSession(title?: string): Session {
  const d = getDb();
  const id = uuidv4().slice(0, 8);
  const now = new Date().toISOString();
  d.prepare(
    'INSERT INTO sessions (id, createdAt, title, state, currentQuestionIndex, votingLocked, audienceCount) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, now, title || 'Dream Heist', 'created', -1, 0, 0);

  // Initialize agent runs
  const roles: AgentRole[] = ['extractor', 'forger', 'architect', 'builder', 'auditor', 'shade'];
  const insertAgent = d.prepare(
    'INSERT INTO agent_runs (id, sessionId, role, status) VALUES (?, ?, ?, ?)'
  );
  for (const role of roles) {
    insertAgent.run(uuidv4(), id, role, 'idle');
  }

  return getSession(id)!;
}

export function getSession(id: string): Session | null {
  const d = getDb();
  const row = d.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    createdAt: row.createdAt as string,
    title: row.title as string,
    state: row.state as SessionState,
    currentQuestionIndex: row.currentQuestionIndex as number,
    votingLocked: (row.votingLocked as number) === 1,
    audienceCount: row.audienceCount as number,
  };
}

export function getLatestSession(): Session | null {
  const d = getDb();
  const row = d.prepare('SELECT * FROM sessions ORDER BY createdAt DESC LIMIT 1').get() as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    createdAt: row.createdAt as string,
    title: row.title as string,
    state: row.state as SessionState,
    currentQuestionIndex: row.currentQuestionIndex as number,
    votingLocked: (row.votingLocked as number) === 1,
    audienceCount: row.audienceCount as number,
  };
}

export function updateSessionState(id: string, state: SessionState) {
  getDb().prepare('UPDATE sessions SET state = ? WHERE id = ?').run(state, id);
}

export function updateSessionField(id: string, field: string, value: unknown) {
  const allowed = ['currentQuestionIndex', 'votingLocked', 'audienceCount', 'state', 'title'];
  if (!allowed.includes(field)) throw new Error(`Invalid field: ${field}`);
  getDb().prepare(`UPDATE sessions SET ${field} = ? WHERE id = ?`).run(value, id);
}

// Participant tracking
export function registerParticipant(sessionId: string, participantId: string) {
  const d = getDb();
  const exists = d.prepare('SELECT 1 FROM participants WHERE sessionId = ? AND participantId = ?').get(sessionId, participantId);
  if (!exists) {
    d.prepare('INSERT INTO participants (sessionId, participantId, joinedAt) VALUES (?, ?, ?)').run(sessionId, participantId, new Date().toISOString());
    // Update audience count
    const count = d.prepare('SELECT COUNT(*) as c FROM participants WHERE sessionId = ?').get(sessionId) as { c: number };
    d.prepare('UPDATE sessions SET audienceCount = ? WHERE id = ?').run(count.c, sessionId);
  }
}

// Vote operations
export function castVote(sessionId: string, questionId: string, participantId: string, optionId: string) {
  const d = getDb();
  d.prepare(
    `INSERT INTO votes (sessionId, questionId, participantId, selectedOptionId, timestamp)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(sessionId, questionId, participantId)
     DO UPDATE SET selectedOptionId = ?, timestamp = ?`
  ).run(sessionId, questionId, participantId, optionId, new Date().toISOString(), optionId, new Date().toISOString());
}

export function getVoteCounts(sessionId: string, questionId: string): Record<string, number> {
  const d = getDb();
  const rows = d.prepare(
    'SELECT selectedOptionId, COUNT(*) as count FROM votes WHERE sessionId = ? AND questionId = ? GROUP BY selectedOptionId'
  ).all(sessionId, questionId) as Array<{ selectedOptionId: string; count: number }>;

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.selectedOptionId] = row.count;
  }
  return counts;
}

export function getAllVoteCounts(sessionId: string): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const q of QUESTIONS) {
    result[q.id] = getVoteCounts(sessionId, q.id);
  }
  return result;
}

export function getParticipantVote(sessionId: string, questionId: string, participantId: string): string | null {
  const d = getDb();
  const row = d.prepare(
    'SELECT selectedOptionId FROM votes WHERE sessionId = ? AND questionId = ? AND participantId = ?'
  ).get(sessionId, questionId, participantId) as { selectedOptionId: string } | undefined;
  return row?.selectedOptionId ?? null;
}

export function getTotalVoteCount(sessionId: string, questionId: string): number {
  const d = getDb();
  const row = d.prepare(
    'SELECT COUNT(*) as c FROM votes WHERE sessionId = ? AND questionId = ?'
  ).get(sessionId, questionId) as { c: number };
  return row.c;
}

// Question results
export function setQuestionWinner(sessionId: string, questionId: string, winnerId: string, winnerLabel: string) {
  getDb().prepare(
    `INSERT INTO question_results (sessionId, questionId, winnerId, winnerLabel)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(sessionId, questionId)
     DO UPDATE SET winnerId = ?, winnerLabel = ?`
  ).run(sessionId, questionId, winnerId, winnerLabel, winnerId, winnerLabel);
}

export function getQuestionResults(sessionId: string): Record<string, { winnerId: string; winnerLabel: string }> {
  const rows = getDb().prepare(
    'SELECT questionId, winnerId, winnerLabel FROM question_results WHERE sessionId = ?'
  ).all(sessionId) as Array<{ questionId: string; winnerId: string; winnerLabel: string }>;

  const results: Record<string, { winnerId: string; winnerLabel: string }> = {};
  for (const row of rows) {
    if (row.winnerId) {
      results[row.questionId] = { winnerId: row.winnerId, winnerLabel: row.winnerLabel };
    }
  }
  return results;
}

// Agent operations
export function getAgentRuns(sessionId: string): AgentRun[] {
  return getDb().prepare(
    `SELECT * FROM agent_runs WHERE sessionId = ? ORDER BY CASE role WHEN 'extractor' THEN 1 WHEN 'architect' THEN 2 WHEN 'forger' THEN 3 WHEN 'builder' THEN 4 WHEN 'shade' THEN 5 WHEN 'auditor' THEN 6 END`
  ).all(sessionId) as AgentRun[];
}

export function updateAgentStatus(sessionId: string, role: AgentRole, status: AgentStatus, extra?: { input?: string; output?: string }) {
  const d = getDb();
  const updates: string[] = ['status = ?'];
  const values: unknown[] = [status];

  if (status === 'active') {
    updates.push('startedAt = ?');
    values.push(new Date().toISOString());
  }
  if (status === 'completed' || status === 'failed') {
    updates.push('completedAt = ?');
    values.push(new Date().toISOString());
  }
  if (extra?.input) {
    updates.push('input = ?');
    values.push(extra.input);
  }
  if (extra?.output) {
    updates.push('output = ?');
    values.push(extra.output);
  }

  values.push(sessionId, role);
  d.prepare(`UPDATE agent_runs SET ${updates.join(', ')} WHERE sessionId = ? AND role = ?`).run(...values);
}

export function resetAgents(sessionId: string) {
  getDb().prepare(
    'UPDATE agent_runs SET status = ?, startedAt = NULL, completedAt = NULL, input = NULL, output = NULL WHERE sessionId = ?'
  ).run('idle', sessionId);
}

// Translation
export function saveTranslation(sessionId: string, data: unknown) {
  getDb().prepare(
    'INSERT OR REPLACE INTO translation_results (sessionId, data) VALUES (?, ?)'
  ).run(sessionId, JSON.stringify(data));
}

export function getTranslation(sessionId: string) {
  const row = getDb().prepare('SELECT data FROM translation_results WHERE sessionId = ?').get(sessionId) as { data: string } | undefined;
  return row ? JSON.parse(row.data) : null;
}

// Artifacts
export function saveArtifact(sessionId: string, role: string, artifactType: string, content: string, filePath?: string) {
  getDb().prepare(
    `INSERT OR REPLACE INTO artifacts (sessionId, role, artifactType, content, filePath)
     VALUES (?, ?, ?, ?, ?)`
  ).run(sessionId, role, artifactType, content, filePath ?? null);
}

export function getArtifacts(sessionId: string): ArtifactRecord[] {
  return getDb().prepare('SELECT * FROM artifacts WHERE sessionId = ?').all(sessionId) as ArtifactRecord[];
}

// Full reset
export function resetSession(sessionId: string) {
  const d = getDb();
  d.prepare('UPDATE sessions SET state = ?, currentQuestionIndex = -1, votingLocked = 0, audienceCount = 0 WHERE id = ?').run('created', sessionId);
  d.prepare('DELETE FROM votes WHERE sessionId = ?').run(sessionId);
  d.prepare('DELETE FROM question_results WHERE sessionId = ?').run(sessionId);
  d.prepare('DELETE FROM translation_results WHERE sessionId = ?').run(sessionId);
  d.prepare('DELETE FROM artifacts WHERE sessionId = ?').run(sessionId);
  d.prepare('DELETE FROM participants WHERE sessionId = ?').run(sessionId);
  resetAgents(sessionId);
}

// Build state operations
export function upsertBuildState(sessionId: string, buildDir: string, status: string) {
  getDb().prepare(
    `INSERT INTO build_state (sessionId, buildDir, status) VALUES (?, ?, ?)
     ON CONFLICT(sessionId) DO UPDATE SET buildDir = ?, status = ?`
  ).run(sessionId, buildDir, status, buildDir, status);
}

export function updateBuildStatus(sessionId: string, status: string) {
  getDb().prepare('UPDATE build_state SET status = ? WHERE sessionId = ?').run(status, sessionId);
}

export function getBuildState(sessionId: string): { buildDir: string; status: string } | null {
  const row = getDb().prepare('SELECT * FROM build_state WHERE sessionId = ?').get(sessionId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return { buildDir: row.buildDir as string, status: row.status as string };
}

export function upsertBuildAgent(sessionId: string, role: string, status: string) {
  getDb().prepare(
    `INSERT INTO build_agents (sessionId, role, status) VALUES (?, ?, ?)
     ON CONFLICT(sessionId, role) DO UPDATE SET status = ?`
  ).run(sessionId, role, status, status);
}

export function getBuildAgents(sessionId: string): Array<{ role: string; status: string }> {
  return getDb().prepare('SELECT role, status FROM build_agents WHERE sessionId = ?').all(sessionId) as Array<{ role: string; status: string }>;
}

export function insertBuildEvent(sessionId: string, event: { timestamp: string; agentRole: string; agentCodename: string; type: string; data: unknown }) {
  getDb().prepare(
    'INSERT INTO build_events (sessionId, timestamp, agentRole, agentCodename, type, data) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(sessionId, event.timestamp, event.agentRole, event.agentCodename, event.type, JSON.stringify(event.data));
}

export function getBuildEventsFromDb(sessionId: string, since?: number): Array<{ timestamp: string; agentRole: string; agentCodename: string; type: string; data: string }> {
  if (since) {
    return getDb().prepare(
      'SELECT timestamp, agentRole, agentCodename, type, data FROM build_events WHERE sessionId = ? AND id > ? ORDER BY id'
    ).all(sessionId, since) as Array<{ timestamp: string; agentRole: string; agentCodename: string; type: string; data: string }>;
  }
  return getDb().prepare(
    'SELECT timestamp, agentRole, agentCodename, type, data FROM build_events WHERE sessionId = ? ORDER BY id'
  ).all(sessionId) as Array<{ timestamp: string; agentRole: string; agentCodename: string; type: string; data: string }>;
}

// Snapshot for SSE initial state
export function getSessionSnapshot(sessionId: string) {
  const session = getSession(sessionId);
  if (!session) return null;

  const questionResults = getQuestionResults(sessionId);
  const questions = QUESTIONS.map(q => ({
    ...q,
    winnerId: questionResults[q.id]?.winnerId ?? null,
    winnerLabel: questionResults[q.id]?.winnerLabel ?? null,
  }));

  return {
    session,
    questions,
    votes: getAllVoteCounts(sessionId),
    agents: getAgentRuns(sessionId),
    translation: getTranslation(sessionId),
    artifacts: getArtifacts(sessionId),
  };
}
