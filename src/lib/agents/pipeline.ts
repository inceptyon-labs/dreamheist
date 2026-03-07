// Fixed agent pipeline with dependency-based execution
// Pipeline: Extractor -> Forger+Architect (parallel) -> Builder -> Auditor -> Compile

import { AgentRole, TranslationResult } from '../types';
import { updateAgentStatus, saveArtifact, updateSessionState } from '../storage/db';
import { broadcast } from '../realtime/sse';
import { runAgent, buildPrompt } from './runner';

// Theatrical pacing delays (ms) for presentation clarity
const STAGE_DELAY = 1500;
const QUEUED_DELAY = 800;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function emitAgentStatus(sessionId: string, role: AgentRole, status: string, message: string) {
  broadcast(sessionId, {
    type: 'agent_status_changed',
    data: { sessionId, role, status, message },
  });
}

function emitArtifact(sessionId: string, role: string, artifactType: string, snippet: string, filePath?: string) {
  broadcast(sessionId, {
    type: 'artifact_generated',
    data: { sessionId, role, artifactType, snippet: snippet.slice(0, 200), filePath },
  });
}

export async function runPipeline(sessionId: string, translation: TranslationResult) {
  const outputs: Record<string, string> = {};

  try {
    // Stage 1: Extractor + Forger + Architect — all in parallel
    // All three only need the translation result (product dimensions).
    // The Forger and Architect CAN use the extractor's output for richer context,
    // but running all three in parallel cuts ~30s off the pipeline.
    await delay(QUEUED_DELAY);

    for (const role of ['extractor', 'forger', 'architect'] as AgentRole[]) {
      updateAgentStatus(sessionId, role, 'queued');
      emitAgentStatus(sessionId, role, 'queued', 'Preparing...');
    }

    await delay(STAGE_DELAY);

    updateAgentStatus(sessionId, 'extractor', 'active');
    updateAgentStatus(sessionId, 'forger', 'active');
    updateAgentStatus(sessionId, 'architect', 'active');
    emitAgentStatus(sessionId, 'extractor', 'active', 'Analyzing product dimensions...');
    emitAgentStatus(sessionId, 'forger', 'active', 'Forging product identity...');
    emitAgentStatus(sessionId, 'architect', 'active', 'Designing technical architecture...');

    const [extractorResult, forgerResult, architectResult] = await Promise.all([
      runAgent({ role: 'extractor', translationResult: translation }),
      runAgent({ role: 'forger', translationResult: translation }),
      runAgent({ role: 'architect', translationResult: translation }),
    ]);

    outputs.extractor = extractorResult.content;
    outputs.forger = forgerResult.content;
    outputs.architect = architectResult.content;

    // Emit completions
    updateAgentStatus(sessionId, 'extractor', 'completed', {
      input: buildPrompt({ role: 'extractor', translationResult: translation }),
      output: extractorResult.content,
    });
    saveArtifact(sessionId, 'extractor', 'agent-output', extractorResult.content);
    emitAgentStatus(sessionId, 'extractor', 'completed', 'Product brief extracted');
    emitArtifact(sessionId, 'extractor', 'agent-output', extractorResult.content);

    updateAgentStatus(sessionId, 'forger', 'completed', {
      input: buildPrompt({ role: 'forger', translationResult: translation }),
      output: forgerResult.content,
    });
    saveArtifact(sessionId, 'forger', 'agent-output', forgerResult.content);
    emitAgentStatus(sessionId, 'forger', 'completed', 'Identity forged');
    emitArtifact(sessionId, 'forger', 'agent-output', forgerResult.content);

    updateAgentStatus(sessionId, 'architect', 'completed', {
      input: buildPrompt({ role: 'architect', translationResult: translation }),
      output: architectResult.content,
    });
    saveArtifact(sessionId, 'architect', 'agent-output', architectResult.content);
    emitAgentStatus(sessionId, 'architect', 'completed', 'Architecture designed');
    emitArtifact(sessionId, 'architect', 'agent-output', architectResult.content);

    // Stage 2: Builder + Auditor — in parallel
    // Builder gets all upstream context to produce the spec.
    // Auditor reviews the brief + architecture (doesn't need the builder's spec).
    await delay(STAGE_DELAY);

    updateAgentStatus(sessionId, 'builder', 'queued');
    updateAgentStatus(sessionId, 'auditor', 'queued');
    emitAgentStatus(sessionId, 'builder', 'queued', 'Preparing build package...');
    emitAgentStatus(sessionId, 'auditor', 'queued', 'Preparing quality review...');

    await delay(QUEUED_DELAY);

    updateAgentStatus(sessionId, 'builder', 'active');
    updateAgentStatus(sessionId, 'auditor', 'active');
    emitAgentStatus(sessionId, 'builder', 'active', 'Building implementation package...');
    emitAgentStatus(sessionId, 'auditor', 'active', 'Auditing product alignment...');

    const [builderResult, auditorResult] = await Promise.all([
      runAgent({
        role: 'builder',
        translationResult: translation,
        extractorOutput: outputs.extractor,
        forgerOutput: outputs.forger,
        architectOutput: outputs.architect,
      }),
      runAgent({
        role: 'auditor',
        translationResult: translation,
        extractorOutput: outputs.extractor,
        architectOutput: outputs.architect,
      }),
    ]);

    outputs.builder = builderResult.content;
    outputs.auditor = auditorResult.content;

    updateAgentStatus(sessionId, 'builder', 'completed', {
      input: buildPrompt({
        role: 'builder',
        translationResult: translation,
        extractorOutput: outputs.extractor,
        forgerOutput: outputs.forger,
        architectOutput: outputs.architect,
      }),
      output: builderResult.content,
    });
    saveArtifact(sessionId, 'builder', 'agent-output', builderResult.content);
    emitAgentStatus(sessionId, 'builder', 'completed', 'Build package ready');
    emitArtifact(sessionId, 'builder', 'agent-output', builderResult.content);

    updateAgentStatus(sessionId, 'auditor', 'completed', {
      input: buildPrompt({
        role: 'auditor',
        translationResult: translation,
        extractorOutput: outputs.extractor,
        architectOutput: outputs.architect,
      }),
      output: auditorResult.content,
    });
    saveArtifact(sessionId, 'auditor', 'agent-output', auditorResult.content);
    emitAgentStatus(sessionId, 'auditor', 'completed', 'Audit complete');
    emitArtifact(sessionId, 'auditor', 'agent-output', auditorResult.content);

    // Stage 5: Internal compilation
    await delay(STAGE_DELAY);

    const masterPrompt = compileMasterPrompt(translation, outputs);
    saveArtifact(sessionId, 'system', 'master', masterPrompt);

    // Extract spec-to-build and task-list from builder output if present
    saveArtifact(sessionId, 'system', 'spec-to-build', extractSection(outputs.builder, 'spec-to-build') || outputs.builder);
    saveArtifact(sessionId, 'system', 'task-list', extractSection(outputs.builder, 'task-list') || 'See builder output for task list.');

    const summary = {
      sessionId,
      translation,
      agents: Object.fromEntries(Object.entries(outputs).map(([k, v]) => [k, v.slice(0, 500)])),
      completedAt: new Date().toISOString(),
    };
    saveArtifact(sessionId, 'system', 'summary', JSON.stringify(summary, null, 2));

    emitArtifact(sessionId, 'system', 'master', masterPrompt);

    updateSessionState(sessionId, 'complete');
    broadcast(sessionId, {
      type: 'pipeline_complete',
      data: { sessionId },
    });
    broadcast(sessionId, {
      type: 'session_state_changed',
      data: { sessionId, state: 'complete' },
    });

  } catch (err) {
    console.error('Pipeline error:', err);
    updateSessionState(sessionId, 'error');
    broadcast(sessionId, {
      type: 'error_occurred',
      data: { sessionId, scope: 'pipeline', message: String(err) },
    });
  }
}

function buildConcreteFormula(meanings: Record<string, string>): string {
  const audience = meanings['the-mark'] || 'general users';
  const need = meanings['the-desire'] || 'solve problems';
  const form = (meanings['the-construct'] || 'tool').split('/')[0].trim();
  const diff = (meanings['the-distortion'] || 'intelligent features').split('/')[0].trim();
  const ux = meanings['the-rule'] || 'intuitive and responsive';
  return `A ${form.toLowerCase()} for users who value ${audience.toLowerCase()}, designed to ${need.toLowerCase()}. Its key capability is ${diff.toLowerCase()}. The experience must be ${ux.toLowerCase()}.`;
}

function compileMasterPrompt(translation: TranslationResult, outputs: Record<string, string>): string {
  const concreteFormula = buildConcreteFormula(translation.mappedMeanings);

  return `# Master Build Prompt

## Product Summary
${concreteFormula}

---

## Product Brief
${outputs.extractor}

---

## Brand Identity
${outputs.forger}

---

## Technical Architecture
${outputs.architect}

---

## Build Package
${outputs.builder}

---

## Quality Review
${outputs.auditor}

---

## Instructions for Claude Code
Build this product as described above. Follow the spec-to-build document and task list from the Build Package. The Technical Architecture provides structural direction. The Brand Identity provides naming and tone. The Quality Review highlights risks to watch for.

Start building.`;
}

function extractSection(text: string, sectionName: string): string | null {
  const markers = [`## ${sectionName}`, `## ${sectionName}.md`, `### ${sectionName}`];
  for (const marker of markers) {
    const idx = text.toLowerCase().indexOf(marker.toLowerCase());
    if (idx >= 0) {
      const start = idx;
      const nextSection = text.indexOf('\n## ', start + marker.length);
      return text.slice(start, nextSection > 0 ? nextSection : undefined).trim();
    }
  }
  return null;
}
