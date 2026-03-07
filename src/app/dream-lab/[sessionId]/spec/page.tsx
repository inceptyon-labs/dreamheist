'use client';

import { useParams } from 'next/navigation';
import { useSession } from '@/lib/hooks';
import { useState, useEffect, useMemo } from 'react';

interface ArtifactRecord {
  sessionId: string;
  role: string;
  artifactType: string;
  content: string;
  filePath: string | null;
}

// Complete symbolic-to-concrete replacement map.
// Every symbolic option label from the voting questions gets replaced with
// its concrete product meaning so nothing abstract leaks into the spec page.
const SYMBOLIC_REPLACEMENTS: Array<[RegExp, string]> = [
  // The Mark (audience archetypes -> concrete user traits)
  [/\bthe restless\b/gi, 'users who value speed, motion, and efficiency'],
  [/\bthe ambitious\b/gi, 'users driven by status, optimization, and performance'],
  [/\bthe overwhelmed\b/gi, 'users who need triage, simplification, and prioritization'],
  [/\bthe curious\b/gi, 'users motivated by discovery, experimentation, and exploration'],
  [/\bthe skeptical\b/gi, 'users who demand proof, trust, and verification'],
  [/\bthe unseen\b/gi, 'users who need visibility, recognition, and surfaced value'],

  // The Desire (abstract wants -> concrete outcomes)
  [/\bdelivers clarity\b/gi, 'reduces confusion and sharpens signal'],
  [/\bdelivers control\b/gi, 'improves agency and decision-making'],
  [/\bdelivers momentum\b/gi, 'reveals progress and next steps'],
  [/\bdelivers recognition\b/gi, 'surfaces value and achievement'],
  [/\bdelivers escape\b/gi, 'provides relief and alternate perspective'],
  [/\bdelivers certainty\b/gi, 'reduces ambiguity and risk'],
  [/\bachieve clarity\b/gi, 'reduce confusion and sharpen signal'],
  [/\bachieve control\b/gi, 'improve agency and decision-making'],
  [/\bachieve momentum\b/gi, 'reveal progress and identify next steps'],
  [/\bachieve recognition\b/gi, 'surface value and achievement'],
  [/\bachieve escape\b/gi, 'find relief and alternate perspective'],
  [/\bachieve certainty\b/gi, 'reduce ambiguity and risk'],
  // Standalone desire words in product context
  [/\bcore promise: clarity\b/gi, 'core promise: reducing confusion and sharpening signal'],
  [/\bcore promise: control\b/gi, 'core promise: improving agency and decisions'],
  [/\bcore promise: momentum\b/gi, 'core promise: revealing progress and next steps'],
  [/\bcore promise: recognition\b/gi, 'core promise: surfacing value and achievement'],
  [/\bcore promise: escape\b/gi, 'core promise: providing relief'],
  [/\bcore promise: certainty\b/gi, 'core promise: reducing ambiguity'],

  // The Construct (dream forms -> product types)
  [/\ba window\b/gi, 'a dashboard'],
  [/\bthe window\b/gi, 'the dashboard'],
  [/\bwindow metaphor\b/gi, 'dashboard interface'],
  [/\ba guide\b/gi, 'an assistant / step-by-step recommender'],
  [/\bthe guide\b/gi, 'the assistant / recommender'],
  [/\bguide metaphor\b/gi, 'assistant interface'],
  [/\ba map\b/gi, 'a navigator / relationship graph'],
  [/\bthe map\b/gi, 'the navigator / relationship graph'],
  [/\bmap metaphor\b/gi, 'navigator interface'],
  [/\ba game\b/gi, 'a scoring and progression system'],
  [/\bthe game\b/gi, 'the scoring and progression system'],
  [/\bgame metaphor\b/gi, 'gamification interface'],
  [/\ba mirror\b/gi, 'a profile / self-assessment tool'],
  [/\bthe mirror\b/gi, 'the profile / self-assessment tool'],
  [/\bmirror metaphor\b/gi, 'self-assessment interface'],
  [/\ba signal\b/gi, 'an alert / confidence engine'],
  [/\bthe signal\b/gi, 'the alert / confidence engine'],
  [/\bsignal metaphor\b/gi, 'alert engine interface'],

  // The Distortion (dream properties -> technical capabilities)
  [/\bit predicts\b/gi, 'it provides forecasting and next-best-action recommendations'],
  [/\bit remembers\b/gi, 'it maintains history, context, and a memory timeline'],
  [/\bit judges\b/gi, 'it provides ranking, scoring, and evaluation'],
  [/\bit reframes\b/gi, 'it offers alternate interpretations and perspective shifting'],
  [/\bit reveals\b/gi, 'it surfaces hidden patterns and latent relationships'],
  [/\bit rewinds\b/gi, 'it enables replay, timeline navigation, and causality inspection'],
  [/\bpredicts engine\b/gi, 'forecasting engine'],
  [/\bremembers engine\b/gi, 'context and history engine'],
  [/\bjudges engine\b/gi, 'ranking and evaluation engine'],
  [/\breframes engine\b/gi, 'perspective-shifting engine'],
  [/\breveals engine\b/gi, 'pattern-surfacing engine'],
  [/\brewinds engine\b/gi, 'timeline and replay engine'],

  // The Rule (dream laws -> UX constraints)
  [/\bit must feel instant\b/gi, 'it must be low-friction with immediate payoff'],
  [/\bmust feel instant\b/gi, 'must be low-friction with immediate payoff'],
  [/\bfeels instant\b/gi, 'is low-friction with immediate payoff'],
  [/\bfeel instant\b/gi, 'be low-friction with immediate payoff'],
  [/\bit must feel inevitable\b/gi, 'it must feel elegant, coherent, and obvious in hindsight'],
  [/\bmust feel inevitable\b/gi, 'must feel elegant, coherent, and obvious in hindsight'],
  [/\bfeels inevitable\b/gi, 'feels elegant and obvious in hindsight'],
  [/\bfeel inevitable\b/gi, 'feel elegant and obvious in hindsight'],
  [/\bit must feel simple\b/gi, 'it must be minimal with low cognitive load'],
  [/\bmust feel simple\b/gi, 'must be minimal with low cognitive load'],
  [/\bfeels simple\b/gi, 'is minimal with low cognitive load'],
  [/\bfeel simple\b/gi, 'be minimal with low cognitive load'],
  [/\bit must feel alive\b/gi, 'it must be dynamic, reactive, and immersive'],
  [/\bmust feel alive\b/gi, 'must be dynamic, reactive, and immersive'],
  [/\bfeels alive\b/gi, 'is dynamic, reactive, and immersive'],
  [/\bfeel alive\b/gi, 'be dynamic, reactive, and immersive'],
  [/\bit must feel trustworthy\b/gi, 'it must be grounded, traceable, and explainable'],
  [/\bmust feel trustworthy\b/gi, 'must be grounded, traceable, and explainable'],
  [/\bfeels trustworthy\b/gi, 'is grounded, traceable, and explainable'],
  [/\bfeel trustworthy\b/gi, 'be grounded, traceable, and explainable'],
  [/\bit must feel dangerous\b/gi, 'it must feel edgy, provocative, and dramatic'],
  [/\bmust feel dangerous\b/gi, 'must feel edgy, provocative, and dramatic'],
  [/\bfeels dangerous\b/gi, 'feels edgy, provocative, and dramatic'],
  [/\bfeel dangerous\b/gi, 'feel edgy, provocative, and dramatic'],

  // Dream layer category names -> product terms
  [/\bThe Mark\b/g, 'Target Audience'],
  [/\bThe Desire\b/g, 'Core Need'],
  [/\bThe Construct\b/g, 'Product Type'],
  [/\bThe Distortion\b/g, 'Differentiator'],
  [/\bThe Rule\b/g, 'UX Constraint'],
  [/\bdream layer/gi, 'product dimension'],
  [/\bdream layers/gi, 'product dimensions'],
  [/\bdream-layer/gi, 'product-dimension'],
  [/\bdream rule/gi, 'UX constraint'],
  [/\bdream rules/gi, 'UX constraints'],
  [/\bdream-rule/gi, 'UX-constraint'],
];

// Replace all symbolic language in a string with concrete product language
function desymbolize(text: string): string {
  let result = text;
  for (const [pattern, replacement] of SYMBOLIC_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// Build a concrete product summary from the mapped meanings (not symbolic inputs)
function buildProductSummary(mappedMeanings: Record<string, string>): {
  audience: string;
  need: string;
  form: string;
  differentiator: string;
  uxPrinciple: string;
  oneLiner: string;
} {
  const audience = mappedMeanings['the-mark'] || '';
  const need = mappedMeanings['the-desire'] || '';
  const form = mappedMeanings['the-construct'] || '';
  const differentiator = mappedMeanings['the-distortion'] || '';
  const uxPrinciple = mappedMeanings['the-rule'] || '';

  // Build a real product sentence from concrete meanings
  const formShort = form.split('/')[0].trim();
  const diffShort = differentiator.split('/')[0].trim();
  const oneLiner = `A ${formShort.toLowerCase()} that helps users ${need.toLowerCase()}, powered by ${diffShort.toLowerCase()}. The experience prioritizes being ${uxPrinciple.toLowerCase()}.`;

  return { audience, need, form, differentiator, uxPrinciple, oneLiner };
}

// Parse agent output into structured sections. Returns heading->body pairs.
function parseAgentOutput(text: string): Array<{ heading: string; content: string }> {
  const lines = text.split('\n');
  const sections: Array<{ heading: string; content: string }> = [];
  let heading = '';
  let body: string[] = [];

  for (const line of lines) {
    const h = line.match(/^#{1,3}\s+(.+)/);
    if (h) {
      if (heading || body.length > 0) {
        sections.push({ heading, content: body.join('\n').trim() });
      }
      heading = h[1];
      body = [];
    } else {
      body.push(line);
    }
  }
  if (heading || body.length > 0) {
    sections.push({ heading, content: body.join('\n').trim() });
  }
  return sections.filter(s => s.content.length > 0);
}

// Extract specific named sections from agent markdown output
function extractSection(text: string, ...names: string[]): string | null {
  const sections = parseAgentOutput(text);
  for (const name of names) {
    const found = sections.find(s => s.heading.toLowerCase().includes(name.toLowerCase()));
    if (found) return found.content;
  }
  return null;
}

// Render text content as styled HTML, handling lists, numbered items, bold, code blocks.
// All text is run through desymbolize() to strip symbolic language.
function RichText({ text }: { text: string }) {
  const lines = desymbolize(text).split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) { i++; continue; }

    // Code block
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={elements.length} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-xs font-mono text-gray-400 overflow-x-auto my-3">
          {codeLines.join('\n')}
        </pre>
      );
      continue;
    }

    // Table row (pipe-delimited)
    if (line.trim().startsWith('|')) {
      const tableRows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        // Skip separator rows like |---|---|
        if (!/^\|[\s-|]+\|$/.test(lines[i].trim())) {
          tableRows.push(lines[i]);
        }
        i++;
      }
      if (tableRows.length > 0) {
        const parseRow = (row: string) => row.split('|').filter(c => c.trim()).map(c => c.trim());
        const header = parseRow(tableRows[0]);
        const body = tableRows.slice(1).map(parseRow);
        elements.push(
          <div key={elements.length} className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-800">
                  {header.map((h, hi) => (
                    <th key={hi} className="text-left py-2 px-3 text-gray-500 font-medium uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-800/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className="py-2 px-3 text-gray-300">{inlineFormat(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Sub-heading (### within a section)
    const subH = line.match(/^#{1,3}\s+(.+)/);
    if (subH) {
      elements.push(
        <h4 key={elements.length} className="text-white font-semibold text-sm mt-4 mb-1">{subH[1]}</h4>
      );
      i++;
      continue;
    }

    // Bullet list
    if (line.match(/^[-*]\s/) || line.match(/^\s+[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].match(/^[-*]\s/) || lines[i].match(/^\s+[-*]\s/))) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={elements.length} className="space-y-1.5 my-2">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm text-gray-300">
              <span className="text-gray-600 shrink-0 mt-0.5">
                <svg width="6" height="6" viewBox="0 0 6 6"><circle cx="3" cy="3" r="2" fill="currentColor" /></svg>
              </span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Checkbox list
    if (line.match(/^-\s*\[[ x]\]\s/)) {
      const items: Array<{ checked: boolean; text: string }> = [];
      while (i < lines.length && lines[i].match(/^-\s*\[[ x]\]\s/)) {
        const m = lines[i].match(/^-\s*\[([ x])\]\s(.+)/);
        if (m) items.push({ checked: m[1] === 'x', text: m[2] });
        i++;
      }
      elements.push(
        <ul key={elements.length} className="space-y-1 my-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
              <span className={`shrink-0 mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center ${item.checked ? 'border-green-600 bg-green-900/30' : 'border-gray-700'}`}>
                {item.checked && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </span>
              <span>{inlineFormat(item.text)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const items: Array<{ num: string; text: string }> = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        const m = lines[i].match(/^(\d+\.)\s(.+)/);
        if (m) items.push({ num: m[1], text: m[2] });
        i++;
      }
      elements.push(
        <ol key={elements.length} className="space-y-1.5 my-2">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-sm text-gray-300">
              <span className="text-gray-600 shrink-0 tabular-nums text-xs font-mono mt-0.5">{item.num}</span>
              <span>{inlineFormat(item.text)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={elements.length} className="text-sm text-gray-300 my-1.5 leading-relaxed">{inlineFormat(line)}</p>
    );
    i++;
  }

  return <div>{elements}</div>;
}

function inlineFormat(text: string): React.ReactNode {
  // Handle bold (**text**), inline code (`code`), and italic (*text*)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-medium">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="text-xs font-mono bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function SpecPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { snapshot } = useSession(sessionId);
  const [artifacts, setArtifacts] = useState<ArtifactRecord[]>([]);

  useEffect(() => {
    fetch(`/api/artifacts?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(data => setArtifacts(data.artifacts || []))
      .catch(() => {});
  }, [sessionId]);

  const translation = snapshot?.translation;
  const extractorAgent = snapshot?.agents.find(a => a.role === 'extractor');
  const forgerAgent = snapshot?.agents.find(a => a.role === 'forger');
  const architectAgent = snapshot?.agents.find(a => a.role === 'architect');
  const builderAgent = snapshot?.agents.find(a => a.role === 'builder');
  const auditorAgent = snapshot?.agents.find(a => a.role === 'auditor');

  const specToBuild = artifacts.find(a => a.artifactType === 'spec-to-build')?.content;
  const taskList = artifacts.find(a => a.artifactType === 'task-list')?.content;

  // Extract product name and tagline
  let productName = 'Untitled Product';
  let tagline = '';
  let pitch = '';
  if (forgerAgent?.output) {
    const allBold = [...forgerAgent.output.matchAll(/\*\*(.+?)\*\*/g)].map(m => m[1]);
    const skipLabels = ['product name', 'tagline', 'short pitch', 'tone', 'brand direction', 'voice', 'visual tone', 'copy style', 'emotional register'];
    const name = allBold.find(b => !skipLabels.includes(b.toLowerCase()));
    if (name) productName = name;
    const italicMatch = forgerAgent.output.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
    const quoteMatch = forgerAgent.output.match(/"(.+?)"/);
    tagline = italicMatch?.[1] || quoteMatch?.[1] || '';
    pitch = desymbolize(extractSection(forgerAgent.output, 'short pitch', 'pitch') || '');
  }

  // Build product summary from mapped meanings
  const summary = translation?.mappedMeanings ? buildProductSummary(translation.mappedMeanings) : null;

  // Extract structured pieces from agent outputs (desymbolize happens in RichText)
  const extracted = useMemo(() => {
    const s = (text: string | undefined | null, ...names: string[]) =>
      text ? extractSection(text, ...names) : null;
    return {
      concept: s(extractorAgent?.output, 'concept'),
      targetUser: s(extractorAgent?.output, 'target user'),
      features: s(extractorAgent?.output, 'core features', 'features'),
      mvpScope: s(extractorAgent?.output, 'mvp scope', 'mvp'),
      visualDirection: s(extractorAgent?.output, 'visual direction', 'visual', 'aesthetic'),
      userStory: s(extractorAgent?.output, 'user story', 'primary user'),
      techStack: s(architectAgent?.output, 'stack', 'recommended stack'),
      screens: s(architectAgent?.output, 'screens', 'information architecture', 'primary screens'),
      dataModel: s(architectAgent?.output, 'data model'),
      implPlan: s(architectAgent?.output, 'implementation plan', 'implementation'),
      risks: s(auditorAgent?.output, 'quality risks', 'risks'),
      scopeCuts: s(auditorAgent?.output, 'scope cuts', 'recommended scope'),
      verdict: s(auditorAgent?.output, 'ship', 'no-ship', 'recommendation', 'merge', 'summary'),
      tone: s(forgerAgent?.output, 'tone', 'brand direction'),
    };
  }, [extractorAgent?.output, architectAgent?.output, auditorAgent?.output, forgerAgent?.output]);

  const hasData = translation || extractorAgent?.output;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800/70 bg-[#0f0f0f]">
        <div className="max-w-5xl mx-auto px-8 py-6 flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-medium mb-1">Product Specification</div>
            <h1 className="text-2xl font-bold text-white">{productName}</h1>
            {tagline && <p className="text-gray-400 mt-1">{tagline}</p>}
            {snapshot?.session?.state === 'complete' && (
              <span className="inline-block mt-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-green-900/30 text-green-500 border border-green-800/40 font-medium">
                Spec Complete
              </span>
            )}
          </div>
          <a
            href={`/dream-lab/${sessionId}`}
            className="text-xs text-gray-500 hover:text-gray-200 transition-colors px-3 py-1.5 rounded border border-gray-800 hover:border-gray-600 mt-1 inline-block"
          >
            Back to Build View
          </a>
        </div>
      </header>

      {!hasData ? (
        <div className="px-8 py-20 text-center text-gray-600 max-w-5xl mx-auto">
          <p className="text-lg font-medium">No spec data available yet</p>
          <p className="text-sm mt-2">The agent pipeline needs to complete before the product spec is generated.</p>
        </div>
      ) : (
        <main className="max-w-5xl mx-auto px-8 py-10">

          {/* ---- OVERVIEW ---- */}
          {summary && (
            <section className="mb-12">
              <p className="text-lg text-gray-200 leading-relaxed max-w-3xl">
                {summary.oneLiner}
              </p>
              {pitch && <p className="text-sm text-gray-400 mt-3 max-w-3xl leading-relaxed">{pitch}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-gray-800/50 rounded-lg overflow-hidden mt-8 border border-gray-800/50">
                <DimensionTile label="Audience" value={summary.audience} />
                <DimensionTile label="Core Need" value={summary.need} />
                <DimensionTile label="Product Type" value={summary.form} />
                <DimensionTile label="Differentiator" value={summary.differentiator} />
                <DimensionTile label="UX Principle" value={summary.uxPrinciple} />
              </div>
            </section>
          )}

          <div className="h-px bg-gray-800/70 mb-10" />

          {/* ---- PRODUCT DEFINITION ---- */}
          <section className="mb-10">
            <SectionHeading>Product Definition</SectionHeading>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {extracted.concept && (
                <ContentBlock title="Concept">
                  <RichText text={extracted.concept} />
                </ContentBlock>
              )}
              {extracted.targetUser && (
                <ContentBlock title="Target User">
                  <RichText text={extracted.targetUser} />
                </ContentBlock>
              )}
              {extracted.userStory && (
                <ContentBlock title="Primary User Story">
                  <RichText text={extracted.userStory} />
                </ContentBlock>
              )}
              {extracted.visualDirection && (
                <ContentBlock title="Visual Direction">
                  <RichText text={extracted.visualDirection} />
                </ContentBlock>
              )}
            </div>

            {extracted.features && (
              <ContentBlock title="Core Features" className="mt-6">
                <RichText text={extracted.features} />
              </ContentBlock>
            )}

            {extracted.mvpScope && (
              <ContentBlock title="MVP Scope" className="mt-6">
                <RichText text={extracted.mvpScope} />
              </ContentBlock>
            )}
          </section>

          {/* ---- BRAND ---- */}
          {extracted.tone && (
            <section className="mb-10">
              <SectionHeading>Brand & Tone</SectionHeading>
              <ContentBlock className="mt-6">
                <RichText text={extracted.tone} />
              </ContentBlock>
            </section>
          )}

          {/* ---- TECHNICAL ARCHITECTURE ---- */}
          {architectAgent?.output && (
            <section className="mb-10">
              <SectionHeading>Technical Architecture</SectionHeading>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {extracted.techStack && (
                  <ContentBlock title="Stack">
                    <RichText text={extracted.techStack} />
                  </ContentBlock>
                )}
                {extracted.dataModel && (
                  <ContentBlock title="Data Model">
                    <RichText text={extracted.dataModel} />
                  </ContentBlock>
                )}
              </div>

              {extracted.screens && (
                <ContentBlock title="Screens & Views" className="mt-6">
                  <RichText text={extracted.screens} />
                </ContentBlock>
              )}

              {extracted.implPlan && (
                <ContentBlock title="Implementation Plan" className="mt-6">
                  <RichText text={extracted.implPlan} />
                </ContentBlock>
              )}
            </section>
          )}

          {/* ---- BUILD SPEC ---- */}
          {(specToBuild || builderAgent?.output) && (
            <section className="mb-10">
              <SectionHeading>Build Specification</SectionHeading>
              <ContentBlock className="mt-6">
                <RichText text={specToBuild || builderAgent!.output!} />
              </ContentBlock>
            </section>
          )}

          {/* ---- TASK LIST ---- */}
          {taskList && (
            <section className="mb-10">
              <SectionHeading>Implementation Tasks</SectionHeading>
              <ContentBlock className="mt-6">
                <RichText text={taskList} />
              </ContentBlock>
            </section>
          )}

          {/* ---- RISK ASSESSMENT ---- */}
          {auditorAgent?.output && (
            <section className="mb-10">
              <SectionHeading>Risk Assessment</SectionHeading>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {extracted.risks && (
                  <ContentBlock title="Identified Risks">
                    <RichText text={extracted.risks} />
                  </ContentBlock>
                )}
                {extracted.scopeCuts && (
                  <ContentBlock title="Recommended Scope Cuts">
                    <RichText text={extracted.scopeCuts} />
                  </ContentBlock>
                )}
              </div>

              {extracted.verdict && (
                <ContentBlock title="Verdict" className="mt-6">
                  <RichText text={extracted.verdict} />
                </ContentBlock>
              )}
            </section>
          )}

          {/* ---- FOOTER ---- */}
          <footer className="text-center text-xs text-gray-700 py-8 border-t border-gray-800/50 mt-10">
            Session {sessionId}
            {snapshot?.session?.createdAt && (
              <span className="ml-2">Created {new Date(snapshot.session.createdAt).toLocaleDateString()}</span>
            )}
          </footer>
        </main>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-[0.15em] border-b border-gray-800/70 pb-2">
      {children}
    </h2>
  );
}

function ContentBlock({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#111] border border-gray-800/60 rounded-lg p-5 ${className}`}>
      {title && <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>}
      {children}
    </div>
  );
}

function DimensionTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#111] px-4 py-3.5">
      <div className="text-[10px] uppercase tracking-wider text-gray-600 font-medium">{label}</div>
      <div className="text-sm text-white mt-1 leading-snug capitalize">{value}</div>
    </div>
  );
}
