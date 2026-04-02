import { ProcessedArticle } from './types';

interface ScoredArticle extends ProcessedArticle {
  finalScore: number;
}

/**
 * Ranks articles using a weighted blend of:
 * - importanceScore (60%): AI-assessed significance
 * - recencyBoost (30%): Exponential decay, 12-hour half-life
 * - breakthroughBonus (10%): Extra weight for breakthroughs
 */
export function rankArticles(articles: ProcessedArticle[]): ScoredArticle[] {
  const now = Date.now();

  return articles
    .map((article) => {
      const ageMs = article.publishedAt
        ? now - article.publishedAt.getTime()
        : 86_400_000;

      const halfLifeMs = 12 * 60 * 60 * 1000; // 12 hours
      const recencyBoost = Math.exp(-ageMs / halfLifeMs);
      const breakthroughBonus = article.isBreakthrough ? 1 : 0;

      const finalScore =
        0.6 * (article.importanceScore / 10) +
        0.3 * recencyBoost +
        0.1 * breakthroughBonus;

      return { ...article, finalScore };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}

/**
 * Filter out low-value articles below the importance threshold.
 */
export function filterByImportance(
  articles: ProcessedArticle[],
  minScore = 4
): ProcessedArticle[] {
  return articles.filter((a) => a.importanceScore >= minScore);
}
