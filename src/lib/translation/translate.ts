// Translation layer: converts symbolic votes into product DNA

import { QuestionKey, TranslationResult } from '../types';
import { QUESTIONS, TRANSLATION_MAP, buildTranslationFormula } from '../questions';

export interface WinnerSet {
  [questionId: string]: { winnerId: string; winnerLabel: string };
}

export function translateWinners(winners: WinnerSet): TranslationResult {
  const symbolicInputs: Record<string, string> = {};
  const mappedMeanings: Record<string, string> = {};
  const winnersByKey: Record<QuestionKey, { optionId: string; label: string }> = {} as Record<QuestionKey, { optionId: string; label: string }>;

  for (const q of QUESTIONS) {
    const winner = winners[q.id];
    if (winner) {
      symbolicInputs[q.key] = winner.winnerLabel;
      const mapping = TRANSLATION_MAP[winner.winnerId];
      mappedMeanings[q.key] = mapping?.meaning || winner.winnerLabel;
      winnersByKey[q.key] = { optionId: winner.winnerId, label: winner.winnerLabel };
    }
  }

  const formula = buildTranslationFormula(winnersByKey);

  return {
    symbolicInputs: symbolicInputs as Record<QuestionKey, string>,
    mappedMeanings: mappedMeanings as Record<QuestionKey, string>,
    formula,
  };
}
