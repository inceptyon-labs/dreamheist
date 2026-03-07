import { Question, QuestionKey } from './types';

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    key: 'the-mark',
    label: 'The Mark',
    prompt: 'Whose mind are we entering?',
    options: [
      { id: 'q1-a', label: 'The restless' },
      { id: 'q1-b', label: 'The ambitious' },
      { id: 'q1-c', label: 'The overwhelmed' },
      { id: 'q1-d', label: 'The curious' },
      { id: 'q1-e', label: 'The skeptical' },
      { id: 'q1-f', label: 'The unseen' },
    ],
    winnerId: null,
    winnerLabel: null,
  },
  {
    id: 'q2',
    key: 'the-desire',
    label: 'The Desire',
    prompt: 'What are they truly chasing?',
    options: [
      { id: 'q2-a', label: 'Clarity' },
      { id: 'q2-b', label: 'Control' },
      { id: 'q2-c', label: 'Momentum' },
      { id: 'q2-d', label: 'Recognition' },
      { id: 'q2-e', label: 'Escape' },
      { id: 'q2-f', label: 'Certainty' },
    ],
    winnerId: null,
    winnerLabel: null,
  },
  {
    id: 'q3',
    key: 'the-construct',
    label: 'The Construct',
    prompt: 'What form does the dream take?',
    options: [
      { id: 'q3-a', label: 'A window' },
      { id: 'q3-b', label: 'A guide' },
      { id: 'q3-c', label: 'A map' },
      { id: 'q3-d', label: 'A game' },
      { id: 'q3-e', label: 'A mirror' },
      { id: 'q3-f', label: 'A signal' },
    ],
    winnerId: null,
    winnerLabel: null,
  },
  {
    id: 'q4',
    key: 'the-distortion',
    label: 'The Distortion',
    prompt: 'What impossible property bends the dream?',
    options: [
      { id: 'q4-a', label: 'It predicts' },
      { id: 'q4-b', label: 'It remembers' },
      { id: 'q4-c', label: 'It judges' },
      { id: 'q4-d', label: 'It reframes' },
      { id: 'q4-e', label: 'It reveals' },
      { id: 'q4-f', label: 'It rewinds' },
    ],
    winnerId: null,
    winnerLabel: null,
  },
  {
    id: 'q5',
    key: 'the-rule',
    label: 'The Rule',
    prompt: 'What law of the dream cannot be broken?',
    options: [
      { id: 'q5-a', label: 'It must feel instant' },
      { id: 'q5-b', label: 'It must feel inevitable' },
      { id: 'q5-c', label: 'It must feel simple' },
      { id: 'q5-d', label: 'It must feel alive' },
      { id: 'q5-e', label: 'It must feel trustworthy' },
      { id: 'q5-f', label: 'It must feel dangerous' },
    ],
    winnerId: null,
    winnerLabel: null,
  },
];

// Translation mapping: each option maps to concrete product DNA
export const TRANSLATION_MAP: Record<string, { meaning: string; keywords: string[] }> = {
  // The Mark
  'q1-a': { meaning: 'speed, motion, efficiency, forward movement', keywords: ['speed', 'motion', 'efficiency'] },
  'q1-b': { meaning: 'status, optimization, performance, recognition', keywords: ['status', 'optimization', 'performance'] },
  'q1-c': { meaning: 'triage, simplification, prioritization, relief', keywords: ['triage', 'simplification', 'relief'] },
  'q1-d': { meaning: 'discovery, experimentation, exploration, novelty', keywords: ['discovery', 'exploration', 'novelty'] },
  'q1-e': { meaning: 'proof, trust, verification, confidence', keywords: ['proof', 'trust', 'verification'] },
  'q1-f': { meaning: 'visibility, recognition, surfacing hidden value', keywords: ['visibility', 'recognition', 'surfacing'] },
  // The Desire
  'q2-a': { meaning: 'reduce confusion, sharpen signal', keywords: ['clarity', 'signal'] },
  'q2-b': { meaning: 'improve agency and decisions', keywords: ['control', 'agency'] },
  'q2-c': { meaning: 'reveal progress and next steps', keywords: ['momentum', 'progress'] },
  'q2-d': { meaning: 'surface value and achievement', keywords: ['recognition', 'achievement'] },
  'q2-e': { meaning: 'provide relief or alternate perspective', keywords: ['escape', 'relief'] },
  'q2-f': { meaning: 'reduce ambiguity and risk', keywords: ['certainty', 'risk-reduction'] },
  // The Construct
  'q3-a': { meaning: 'dashboard / lens / visibility surface', keywords: ['dashboard', 'lens'] },
  'q3-b': { meaning: 'assistant / recommender / step-by-step flow', keywords: ['assistant', 'guide'] },
  'q3-c': { meaning: 'navigator / relationship graph / dependency explorer', keywords: ['navigator', 'map'] },
  'q3-d': { meaning: 'scoring, challenge, simulation, progression', keywords: ['game', 'challenge'] },
  'q3-e': { meaning: 'profile, reflection, interpretation, self-model', keywords: ['mirror', 'reflection'] },
  'q3-f': { meaning: 'score, alert, confidence engine, distilled output', keywords: ['signal', 'alert'] },
  // The Distortion
  'q4-a': { meaning: 'forecasting / next-best action / risk anticipation', keywords: ['prediction', 'forecasting'] },
  'q4-b': { meaning: 'history / context / memory timeline', keywords: ['memory', 'history'] },
  'q4-c': { meaning: 'ranking / scoring / evaluation', keywords: ['judgment', 'ranking'] },
  'q4-d': { meaning: 'alternate interpretation / perspective shifting', keywords: ['reframing', 'perspective'] },
  'q4-e': { meaning: 'hidden patterns / latent relationships / insight surfacing', keywords: ['revelation', 'patterns'] },
  'q4-f': { meaning: 'replay / timeline / causality inspection', keywords: ['rewind', 'causality'] },
  // The Rule
  'q5-a': { meaning: 'low friction, immediate payoff', keywords: ['instant', 'friction-free'] },
  'q5-b': { meaning: 'elegant, coherent, obvious in hindsight', keywords: ['inevitable', 'elegant'] },
  'q5-c': { meaning: 'minimal, understandable, low cognitive load', keywords: ['simple', 'minimal'] },
  'q5-d': { meaning: 'dynamic, reactive, immersive', keywords: ['alive', 'dynamic'] },
  'q5-e': { meaning: 'grounded, traceable, explainable', keywords: ['trustworthy', 'traceable'] },
  'q5-f': { meaning: 'edgy, provocative, dramatic', keywords: ['dangerous', 'provocative'] },
};

// Template parts for the translation formula
const FORMULA_PARTS: Record<QuestionKey, { prefix: string; suffix: string }> = {
  'the-mark': { prefix: 'For', suffix: '' },
  'the-desire': { prefix: 'create a', suffix: 'that delivers' },
  'the-construct': { prefix: '', suffix: '' },
  'the-distortion': { prefix: 'distinguished by its ability to', suffix: '' },
  'the-rule': { prefix: 'while ensuring the experience', suffix: '' },
};

export function buildTranslationFormula(winners: Record<QuestionKey, { optionId: string; label: string }>): string {
  const mark = winners['the-mark'].label.toLowerCase();
  const desire = winners['the-desire'].label.toLowerCase();
  const construct = winners['the-construct'].label.toLowerCase();
  const distortionRaw = winners['the-distortion'].label.toLowerCase().replace('it ', '');
  // Convert third person to infinitive: "predicts"->"predict", "remembers"->"remember", etc.
  const distortion = distortionRaw.replace(/s$/, '');
  const rule = winners['the-rule'].label.toLowerCase().replace('it must feel ', 'feels ');

  return `For ${mark}, create ${construct} that delivers ${desire}, distinguished by its ability to ${distortion}, while ensuring the experience ${rule}.`;
}

export function getQuestionByIndex(index: number): Question | null {
  return QUESTIONS[index] ?? null;
}
