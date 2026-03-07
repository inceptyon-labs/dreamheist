// Milestone quotes - in-character one-liners for key build moments
// These get broadcast to both Dream Lab comms and audience phones

export interface MilestoneQuote {
  agentRole: string;
  agentCodename: string;
  quote: string;
  milestone: string; // for display: "First file", "Tests passing", etc.
}

// Per-agent quote pools for different milestone types
const QUOTES: Record<string, Record<string, string[]>> = {
  extractor: {
    start: ['We need to go deeper.', 'The dream begins now. Trust the process.'],
    first_file: ['The foundation is set. Now we build.', 'This is the real thing.'],
    complete: ['My work here is done. The rest is up to them.', "I've planted the seed. Time to go deeper."],
  },
  architect: {
    start: ['I see the whole structure. Every level, every paradox.', 'The levels are forming...'],
    first_file: ['The first level is built. The structure holds.', 'Impossible geometry, made real.'],
    complete: ['Every level connects. The architecture is sound.', 'The maze is complete. No one gets lost.'],
  },
  forger: {
    start: ['Let me make this beautiful, darling.', 'Perception is everything.'],
    first_file: ['The first face is worn. Many more to come.', "Now we're selling the dream."],
    skill_used: ['A little extra polish, darling. Perception is everything.', 'Time to wear a different face.'],
    complete: ['Every surface tells the story. The dream looks real.', 'My finest work, if I do say so myself.'],
  },
  builder: {
    start: ['Steady... steady... mixing the compound.', 'The chemistry must be precise.'],
    first_file: ['The first reaction is stable. The mixture holds.', 'Steady... the compound is forming.'],
    complete: ['The compound is stable. The machinery works.', 'Every gear turns. The kick will come.'],
  },
  shade: {
    start: ['How do you know this is real? Let me test that.', 'Shall I test that for you?'],
    first_test: ['The first test is written. Reality will be tested.', 'This dream has a flaw. I\'ll find it.'],
    tests_passing: ['Reality holds... for now.', 'The tests agree with reality. Suspicious.'],
    tests_failing: ['I knew it. This dream has cracks.', "You're not thinking deep enough. The tests don't lie."],
    complete: ["I've tested every seam. Reality holds... for now.", "If there's a flaw, it's hidden well. For now."],
  },
  auditor: {
    start: ["I trust nothing until I've verified it myself.", 'Let me check the details.'],
    first_file: ['First review complete. The details matter.', "I've checked twice. This one's clean."],
    complete: ["Every detail verified. Every connection solid. It's clean.", "I've checked everything twice. We're good."],
  },
};

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Track milestones per session to avoid repeats
const sessionMilestones = new Map<string, Set<string>>();

export function checkMilestone(
  sessionId: string,
  agentRole: string,
  agentCodename: string,
  eventType: string,
  toolName?: string,
): MilestoneQuote | null {
  const key = `${sessionId}-${agentRole}`;
  if (!sessionMilestones.has(key)) {
    sessionMilestones.set(key, new Set());
  }
  const seen = sessionMilestones.get(key)!;
  const agentQuotes = QUOTES[agentRole];
  if (!agentQuotes) return null;

  let milestoneType: string | null = null;
  let milestoneLabel = '';

  // Detect milestone
  if (eventType === 'status' && !seen.has('start')) {
    milestoneType = 'start';
    milestoneLabel = 'Entering the dream';
  } else if (eventType === 'tool_use' && toolName) {
    const t = toolName.toLowerCase();
    if ((t.includes('write') || t.includes('create')) && !seen.has('first_file')) {
      milestoneType = 'first_file';
      milestoneLabel = 'First file created';
    }
    if (t === 'skill' && agentQuotes.skill_used && !seen.has('skill_used')) {
      milestoneType = 'skill_used';
      milestoneLabel = 'Skill invoked';
    }
    // Mal-specific: first test written
    if (agentRole === 'shade' && (t.includes('write') || t.includes('create')) && !seen.has('first_test')) {
      milestoneType = 'first_test';
      milestoneLabel = 'First test written';
    }
    // Mal-specific: bash with vitest (test execution)
    if (agentRole === 'shade' && t.includes('bash') && !seen.has('tests_passing')) {
      milestoneType = 'tests_passing';
      milestoneLabel = 'Tests executing';
    }
  } else if (eventType === 'complete' && !seen.has('complete')) {
    milestoneType = 'complete';
    milestoneLabel = 'Work complete';
  }

  if (!milestoneType) return null;

  const quotes = agentQuotes[milestoneType];
  if (!quotes) return null;

  seen.add(milestoneType);

  return {
    agentRole,
    agentCodename,
    quote: pickRandom(quotes),
    milestone: milestoneLabel,
  };
}

// Clean up session tracking
export function clearSessionMilestones(sessionId: string) {
  for (const key of sessionMilestones.keys()) {
    if (key.startsWith(`${sessionId}-`)) {
      sessionMilestones.delete(key);
    }
  }
}
