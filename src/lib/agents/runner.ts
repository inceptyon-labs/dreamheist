// Agent execution runner — uses Claude Code CLI (subscription) with fallback templates

import { spawn } from 'child_process';
import { AgentRole, TranslationResult } from '../types';
import { getFallbackOutput } from './fallback';

export interface AgentInput {
  role: AgentRole;
  translationResult: TranslationResult;
  extractorOutput?: string;
  forgerOutput?: string;
  architectOutput?: string;
  builderOutput?: string;
}

export interface AgentOutput {
  content: string;
  source: 'live' | 'fallback';
}

const AGENT_TIMEOUT_MS = 180000;

// Dimension key -> product-language label
const DIMENSION_LABELS: Record<string, string> = {
  'the-mark': 'Target Audience',
  'the-desire': 'Core Need',
  'the-construct': 'Product Type',
  'the-distortion': 'Key Capability',
  'the-rule': 'UX Principle',
};

function buildConcreteFormula(meanings: Record<string, string>): string {
  const audience = meanings['the-mark'] || 'general users';
  const need = meanings['the-desire'] || 'solve problems';
  const form = (meanings['the-construct'] || 'tool').split('/')[0].trim();
  const diff = (meanings['the-distortion'] || 'intelligent features').split('/')[0].trim();
  const ux = meanings['the-rule'] || 'intuitive and responsive';
  return `A ${form.toLowerCase()} for users who value ${audience.toLowerCase()}, designed to ${need.toLowerCase()}. Its key capability is ${diff.toLowerCase()}. The experience must be ${ux.toLowerCase()}.`;
}

function buildPrompt(input: AgentInput): string {
  const { role, translationResult } = input;
  const meanings = Object.entries(translationResult.mappedMeanings)
    .map(([key, val]) => `- ${DIMENSION_LABELS[key] || key}: ${val}`)
    .join('\n');
  const concreteFormula = buildConcreteFormula(translationResult.mappedMeanings);

  const context = `## Product Context

### Product Dimensions
${meanings}

### Product Summary
${concreteFormula}`;

  switch (role) {
    case 'extractor':
      return `${context}

## Your Role: Product Analyst
Turn the product dimensions above into a concrete product brief. Use clear, specific product language -- no abstract or metaphorical terms.

Produce:
- Product concept (2-3 sentences describing what this product actually does)
- Target user description (who they are, what their day looks like, what frustrates them)
- Primary user story (As a [user], I want [capability], so that [outcome])
- 3 core features (specific, buildable features with clear descriptions)
- MVP scope definition (what's in, what's out for a prototype)
- Visual direction / aesthetic

Be specific and concrete. This will be used to actually build a prototype. Do not use abstract language like "the mark" or "the construct" -- describe real users, real features, and real interactions.`;

    case 'forger':
      return `${context}

## Your Role: Brand Strategist
Create naming, tagline, positioning, and thematic polish for this product.

Produce:
- Product name (creative, memorable)
- Tagline (one line)
- Short pitch (2-3 sentences)
- Tone / brand direction

Be bold but appropriate for a tech product demo. Use concrete product language, not abstract metaphors.`;

    case 'architect':
      return `${context}

## Your Role: Technical Architect
Turn this concept into technical and UX structure.

Produce:
- Recommended stack
- Information architecture (key screens/views)
- Primary screens list with descriptions
- Data model sketch
- Implementation plan (high-level steps)

Keep it practical for a prototype build. Use concrete technical language.`;

    case 'builder':
      return `${context}

## Product Brief
${input.extractorOutput}

## Brand Identity
${input.forgerOutput}

## Technical Architecture
${input.architectOutput}

## Your Role: Implementation Lead
Convert all the above into a build-ready prototype package.

Produce:
1. A complete spec-to-build.md document that a developer could follow
2. A task-list.md with ordered implementation tasks
3. A file structure suggestion
4. An MVP implementation checklist

IMPORTANT — First-Time User Experience:
The spec MUST include a welcome/intro experience as a top-priority task. Users will open this product with zero context — they won't know what it is, what it does, or how to use it. The spec should require:
- A welcome modal or intro screen that appears on first visit
- The product name, a one-line description of what it does, and 2-3 bullets on how to use it
- A "Get Started" button that dismisses the intro and drops the user into the main experience
- For games: include controls/rules. For tools: include a quick walkthrough of the main workflow.
This is critical — without it the product is unusable to someone seeing it for the first time.

This is the final build prompt that goes into Claude Code. Use concrete, technical language throughout.`;

    case 'auditor':
      return `${context}

## Product Brief
${input.extractorOutput}

## Technical Architecture
${input.architectOutput}

## Your Role: Quality Reviewer
Critique the concept and verify it matches the original product requirements.

Produce:
- Quality risks (what could go wrong)
- Recommended scope cuts
- Verification checklist (does the build spec satisfy each product dimension?)
- Ship / No-ship recommendation with reasoning

Be honest and critical. Use concrete product and technical language.`;
    default:
      return `${context}\n\nProduce output for role: ${role}`;
  }
}

async function callClaudeCli(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    const stderrChunks: string[] = [];

    const proc = spawn('claude', [
      '-p', prompt,
      '--output-format', 'text',
      '--no-session-persistence',
      '--model', 'sonnet',
      '--max-turns', '1',
    ], {
      cwd: process.cwd(),
      env: { ...process.env, CLAUDECODE: '' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`Claude CLI timed out after ${AGENT_TIMEOUT_MS}ms`));
    }, AGENT_TIMEOUT_MS);

    proc.stdout?.on('data', (chunk) => {
      chunks.push(chunk.toString());
    });

    proc.stderr?.on('data', (chunk) => {
      stderrChunks.push(chunk.toString());
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(chunks.join('').trim());
      } else {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderrChunks.join('').slice(0, 300)}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn claude CLI: ${err.message}`));
    });
  });
}

export async function runAgent(input: AgentInput): Promise<AgentOutput> {
  try {
    const prompt = buildPrompt(input);
    const content = await callClaudeCli(prompt);
    if (content) {
      return { content, source: 'live' };
    }
  } catch (err) {
    console.error(`Claude CLI agent ${input.role} failed, using fallback:`, err);
  }

  // Fallback to deterministic templates
  const content = getFallbackOutput(input.role, input.translationResult);
  return { content, source: 'fallback' };
}

export { buildPrompt };
