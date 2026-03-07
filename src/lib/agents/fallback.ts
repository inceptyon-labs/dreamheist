// Deterministic fallback outputs for when live Claude is unavailable

import { AgentRole, TranslationResult } from '../types';

export function getFallbackOutput(role: AgentRole, translation: TranslationResult): string {
  const inputs = translation.symbolicInputs;
  const meanings = translation.mappedMeanings;

  // Use concrete meanings, not symbolic labels
  const audience = meanings['the-mark'] || 'general users';
  const need = meanings['the-desire'] || 'reduce confusion and sharpen signal';
  const formFull = meanings['the-construct'] || 'dashboard / lens / visibility surface';
  const form = formFull.split('/')[0].trim().toLowerCase();
  const capFull = meanings['the-distortion'] || 'hidden patterns / latent relationships / insight surfacing';
  const capability = capFull.split('/')[0].trim().toLowerCase();
  const uxFull = meanings['the-rule'] || 'minimal, understandable, low cognitive load';
  const ux = uxFull.toLowerCase();

  const productName = generateProductName(inputs);

  switch (role) {
    case 'extractor':
      return `# Product Brief

## Concept
A web application built as a ${form} for users who value ${audience}. The product helps users ${need} through an interface powered by ${capability}. The experience is ${ux}.

## Target User
Professionals who value ${audience} in their daily workflow. They need tools that help them ${need}. They are frustrated by existing solutions that are either too complex or too shallow. They want something that feels ${ux}.

## Primary User Story
As a professional who values ${audience}, I want a ${form} that helps me ${need}, so that I can make better decisions faster with an experience that is ${ux}.

## Core Features
1. **${capitalize(capability)} Engine** - The core capability. Provides ${capFull} so users can see what they'd otherwise miss.
2. **Insight Dashboard** - A clean, focused interface that delivers the core promise: helping users ${need}.
3. **Adaptive Interface** - The ${form} adjusts to user behavior and context while maintaining an experience that is ${ux}.

## MVP Scope
Build a single-page prototype with:
- A main view implementing the ${form} interface pattern
- The ${capability} capability as the hero feature
- Clean, focused interactions that are ${ux}
- Sample data that demonstrates the value proposition

## Visual Direction
Clean, purposeful design. Restrained palette with one accent color. Typography-forward with clear hierarchy. Subtle animations that reinforce the ${ux} principle. Modern, intelligent aesthetic.`;

    case 'forger':
      return `# Brand Identity

## Product Name
**${productName}**

## Tagline
"${generateTagline(inputs)}"

## Short Pitch
${productName} is a ${form} for professionals who value ${audience}. It provides ${capability}, making it easy to ${need}. The experience is ${ux}. Built for people who believe the best tools are the ones that disappear into the work.

## Tone / Brand Direction
- **Voice**: Confident but not arrogant. Clear but not simplistic.
- **Visual tone**: Dark-mode friendly, with luminous accent elements. Think mission control meets focused workspace.
- **Copy style**: Short sentences. Active verbs. No jargon. Each word earns its place.
- **Emotional register**: The feeling of having exactly the right tool for the job.`;

    case 'architect':
      return `# Technical Architecture

## Recommended Stack
- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS with a custom design system
- **State**: React hooks with context for client state
- **Backend**: Next.js API routes
- **Data**: Local SQLite for prototype (easy to swap)
- **Realtime**: SSE for live updates

## Information Architecture
1. **Home / Landing** - Entry point, introduces the product
2. **Main View** - The core ${form} experience
3. **Detail Panel** - Deep dive into selected items
4. **Settings** - Configuration and preferences

## Primary Screens

### 1. Main ${capitalize(form)} View
The primary screen. Users see their data organized through the ${form} interface, with ${capability} results surfaced prominently.

### 2. Insight Panel
When the system performs ${capability}, results appear here. Clean, scannable, actionable. Each insight links back to its source data.

### 3. History / Timeline
Track how insights and patterns evolve over time. Provides temporal context for the ${capability} feature.

## Data Model
- **User**: id, preferences, history
- **Item**: id, type, metadata, relationships
- **Insight**: id, source_items[], type, confidence, timestamp
- **View**: id, user_id, configuration, filters

## Implementation Plan
1. Set up Next.js project with TypeScript and Tailwind
2. Build the main ${form} view with sample data
3. Implement the ${capability} engine
4. Add detail panels and navigation
5. Polish interactions to ensure the experience is ${ux}
6. Add sample data and demo flow`;

    case 'builder':
      return `# Build Package

## spec-to-build.md

### Overview
Build a prototype of ${productName}: a ${form} for users who value ${audience}, designed to help them ${need}.

### Requirements
1. The application implements a ${form} interface
2. The signature capability is ${capability} (${capFull})
3. The experience must be ${ux}
4. Use sample/seeded data for the prototype
5. Mobile-responsive design

### Technical Decisions
- Next.js App Router with TypeScript
- Tailwind CSS for styling
- Local data (no external database needed for prototype)
- Single deployment target

### Key Components
1. \`MainView\` - The primary ${form} interface
2. \`InsightEngine\` - The ${capability} capability
3. \`DetailPanel\` - Expanded view for items/insights
4. \`Navigation\` - Clean routing between views

---

## task-list.md

### Phase 1: Foundation
- [ ] Initialize Next.js project with TypeScript and Tailwind
- [ ] Set up project structure and routing
- [ ] Create design tokens and base components
- [ ] Build responsive layout shell

### Phase 2: Core Experience
- [ ] Implement main ${form} view
- [ ] Build sample data generator
- [ ] Create item/entity display components
- [ ] Add interaction patterns (click, hover, filter)

### Phase 3: Signature Feature
- [ ] Build the ${capability} engine
- [ ] Create insight display components
- [ ] Wire insights to source data
- [ ] Add visual indicators for discovered patterns

### Phase 4: Polish
- [ ] Ensure the experience is ${ux}
- [ ] Add transitions and micro-animations
- [ ] Responsive testing
- [ ] Demo flow with guided sample data

### File Structure
\`\`\`
/app
  /page.tsx              # Landing / entry
  /main/page.tsx         # Core ${form} view
  /detail/[id]/page.tsx  # Detail view
/components
  /MainView.tsx
  /InsightEngine.tsx
  /DetailPanel.tsx
  /Navigation.tsx
/lib
  /data.ts               # Sample data
  /engine.ts             # ${capability} logic
  /types.ts
\`\`\`

### MVP Checklist
- [ ] Core ${form} view renders with sample data
- [ ] ${capitalize(capability)} capability produces visible results
- [ ] Navigation between views works
- [ ] Experience is ${ux}
- [ ] Looks good on both desktop and mobile
- [ ] Demo-ready with compelling sample data`;

    case 'auditor':
      return `# Quality Review

## Quality Risks
1. **Scope creep on ${capability}** - The signature capability could become an unbounded feature. Keep it focused on 2-3 clear pattern types for MVP.
2. **"${ux}" is subjective** - Define specific, testable criteria for what this means in practice (e.g., response times, animation durations, interaction counts).
3. **Sample data quality** - The demo is only as compelling as its data. Invest time in crafting realistic, interesting sample datasets.

## Recommended Scope Cuts
- Skip user accounts and auth for prototype
- No real backend data persistence needed
- Skip settings/preferences screen
- Limit to 1-2 insight types rather than trying to cover all possibilities
- No export or sharing features

## Verification Checklist
| Dimension | Requirement | Status |
|---|---|---|
| Target Audience (${audience}) | Product serves this user type | PASS - Design targets users who value ${audience} |
| Core Need (${need}) | Product delivers this outcome | PASS - Core value prop addresses this need |
| Product Type (${formFull}) | Interface follows this pattern | PASS - UI implements ${form} pattern |
| Key Capability (${capFull}) | Feature works | VERIFY - Must be demonstrable in prototype |
| UX Principle (${uxFull}) | Constraint respected | VERIFY - Needs specific metrics defined |

## Ship / No-ship Recommendation
**SHIP** with conditions:
- The concept is coherent and buildable
- All five product dimensions are represented in the design
- The scope is appropriate for a prototype
- Conditions: Ensure ${capability} capability has at least one working demo scenario, and define measurable criteria for "${ux}"`;
    default:
      return `Fallback output for role: ${role}`;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateProductName(inputs: Record<string, string>): string {
  const construct = inputs['the-construct'] || '';
  const distortion = inputs['the-distortion'] || '';

  const nameMap: Record<string, Record<string, string>> = {
    'A window': { 'It predicts': 'Foresight', 'It remembers': 'Recall', 'It judges': 'Verdict', 'It reframes': 'Prism', 'It reveals': 'Aperture', 'It rewinds': 'Retroview' },
    'A guide': { 'It predicts': 'Pathfinder', 'It remembers': 'Chronicle', 'It judges': 'Arbiter', 'It reframes': 'Parallax', 'It reveals': 'Luminary', 'It rewinds': 'Retrace' },
    'A map': { 'It predicts': 'Wayfinder', 'It remembers': 'Atlas', 'It judges': 'Compass', 'It reframes': 'Meridian', 'It reveals': 'Cartograph', 'It rewinds': 'Backtrack' },
    'A game': { 'It predicts': 'Forecast', 'It remembers': 'Replay', 'It judges': 'Tribunal', 'It reframes': 'Shift', 'It reveals': 'Unveiled', 'It rewinds': 'Rewind' },
    'A mirror': { 'It predicts': 'Oracle', 'It remembers': 'Echo', 'It judges': 'Reflect', 'It reframes': 'Kaleidoscope', 'It reveals': 'Clarity', 'It rewinds': 'Hindsight' },
    'A signal': { 'It predicts': 'Beacon', 'It remembers': 'Resonance', 'It judges': 'Sentinel', 'It reframes': 'Spectrum', 'It reveals': 'Pulse', 'It rewinds': 'Echo' },
  };

  return nameMap[construct]?.[distortion] || 'Nexus';
}

function generateTagline(inputs: Record<string, string>): string {
  const desire = inputs['the-desire'] || 'clarity';
  const rule = (inputs['the-rule'] || '').replace('It must feel ', '').replace('it must feel ', '');

  const taglines: Record<string, Record<string, string>> = {
    'Clarity': {
      'instant': 'See clearly. Act instantly.',
      'inevitable': 'The answer was always there.',
      'simple': 'Complexity, distilled.',
      'alive': 'Watch understanding emerge.',
      'trustworthy': 'Truth you can trace.',
      'dangerous': 'Cut through everything.',
    },
    'Control': {
      'instant': 'Command at the speed of thought.',
      'inevitable': 'Every decision, inevitable.',
      'simple': 'Power without complexity.',
      'alive': 'Control that breathes with you.',
      'trustworthy': 'Decisions you can defend.',
      'dangerous': 'Wield it carefully.',
    },
    'Momentum': {
      'instant': 'Never lose speed.',
      'inevitable': 'Progress that builds itself.',
      'simple': 'Forward, simplified.',
      'alive': 'Feel the acceleration.',
      'trustworthy': 'Progress you can prove.',
      'dangerous': 'Unstoppable.',
    },
    'Recognition': {
      'instant': 'Be seen. Instantly.',
      'inevitable': 'Your impact, undeniable.',
      'simple': 'Value, surfaced simply.',
      'alive': 'Watch your value grow.',
      'trustworthy': 'Merit made visible.',
      'dangerous': 'Make them notice.',
    },
    'Escape': {
      'instant': 'Relief in an instant.',
      'inevitable': 'Freedom was always possible.',
      'simple': 'Breathe.',
      'alive': 'Feel the weight lift.',
      'trustworthy': 'A way out you can trust.',
      'dangerous': 'Break free.',
    },
    'Certainty': {
      'instant': 'Know now.',
      'inevitable': 'Certainty was always there.',
      'simple': 'Doubt, eliminated.',
      'alive': 'Confidence that compounds.',
      'trustworthy': 'Certainty you can verify.',
      'dangerous': 'Remove all doubt.',
    },
  };

  return taglines[desire]?.[rule] || `${desire}, reimagined.`;
}
