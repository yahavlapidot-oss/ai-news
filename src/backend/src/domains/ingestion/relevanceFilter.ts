import keywordsConfig from '../../../../../config/ai-keywords.json';

const REQUIRED = keywordsConfig.required.map((k) => k.toLowerCase());
const BOOSTED = keywordsConfig.boosted.map((k) => k.toLowerCase());
const NOISE = keywordsConfig.noise.map((k) => k.toLowerCase());

/**
 * Scores relevance of a title+content pair against the AI keyword taxonomy.
 * Returns 0.0–1.0. Avoids any AI API calls — purely lexical.
 *
 * Rules:
 * - Any noise keyword → 0.0 (discard immediately)
 * - Required keyword match: +0.15 per unique match, capped at 0.75
 * - Boosted keyword match: +0.10 per unique match
 * - Title match worth 2× content match
 */
export function scoreRelevance(title: string, content: string): number {
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  const combined = `${titleLower} ${contentLower}`;

  // Noise check — instant discard
  if (NOISE.some((n) => combined.includes(n))) return 0;

  let score = 0;

  for (const kw of REQUIRED) {
    const inTitle = titleLower.includes(kw);
    const inContent = contentLower.includes(kw);
    if (inTitle) score += 0.3;
    else if (inContent) score += 0.15;
    if (score >= 0.75) break;
  }

  if (score > 0) {
    for (const kw of BOOSTED) {
      if (combined.includes(kw)) score += 0.1;
    }
  }

  return Math.min(1, score);
}

/**
 * Returns true if the article passes the relevance threshold.
 * Threshold 0.15 = at least one clear AI keyword in title.
 */
export function isRelevant(title: string, content: string, threshold = 0.15): boolean {
  return scoreRelevance(title, content) >= threshold;
}
