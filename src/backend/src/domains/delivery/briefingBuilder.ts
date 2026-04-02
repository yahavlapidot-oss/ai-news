import { query, queryOne } from '../../infrastructure/database/db';
import { synthesizeBriefing } from '../processing/analyzer';
import { rankArticles } from '../processing/ranker';
import { ProcessedArticle } from '../processing/types';

interface ArticleRow {
  id: string;
  source_id: string;
  url: string;
  title: string;
  clean_content: string;
  summary: string;
  key_takeaways: string;
  category: string;
  importance_score: number;
  importance_reason: string;
  is_breakthrough: boolean;
  related_topics: string;
  author: string;
  published_at: string;
  content_hash: string;
}

function rowToArticle(row: ArticleRow): ProcessedArticle {
  return {
    rawArticleId: row.id,
    sourceId: row.source_id,
    url: row.url,
    title: row.title,
    cleanContent: row.clean_content,
    summary: row.summary,
    keyTakeaways: JSON.parse(row.key_takeaways ?? '[]'),
    category: row.category as ProcessedArticle['category'],
    importanceScore: row.importance_score,
    importanceReason: row.importance_reason,
    isBreakthrough: row.is_breakthrough,
    relatedTopics: JSON.parse(row.related_topics ?? '[]'),
    author: row.author,
    publishedAt: row.published_at ? new Date(row.published_at) : undefined,
  };
}

export async function buildDailyBriefing(date: string): Promise<{
  id: string;
  date: string;
  articleCount: number;
  keyTrends: Array<{ title: string; description: string }>;
  executiveSummary: string;
}> {
  // Get all articles from the last 24 hours
  const rows = await query<ArticleRow>(
    `SELECT * FROM articles
     WHERE published_at >= $1::date AND published_at < $1::date + INTERVAL '1 day'
        OR (published_at IS NULL AND processed_at >= NOW() - INTERVAL '24 hours')
     ORDER BY importance_score DESC`,
    [date]
  );

  const articles = rows.map(rowToArticle);
  const ranked = rankArticles(articles);
  const top5Ids = ranked.slice(0, 5).map((a) => a.rawArticleId);

  const { executiveSummary, keyTrends } = await synthesizeBriefing(
    ranked.slice(0, 30).map((a) => ({
      title: a.title,
      summary: a.summary,
      importanceScore: a.importanceScore,
      category: a.category,
    })),
    date
  );

  const readTimeMinutes = Math.max(3, Math.ceil(ranked.slice(0, 10).length * 0.5));

  // Upsert briefing
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM daily_briefings WHERE date = $1',
    [date]
  );

  if (existing) {
    await query(
      `UPDATE daily_briefings SET
        headline_article_ids = $2, executive_summary = $3, key_trends = $4,
        article_count = $5, read_time_minutes = $6, built_at = NOW()
       WHERE date = $1`,
      [date, top5Ids, executiveSummary, JSON.stringify(keyTrends), articles.length, readTimeMinutes]
    );
    return { id: existing.id, date, articleCount: articles.length, keyTrends, executiveSummary };
  }

  const result = await query<{ id: string }>(
    `INSERT INTO daily_briefings
       (date, headline_article_ids, executive_summary, key_trends, article_count, read_time_minutes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [date, top5Ids, executiveSummary, JSON.stringify(keyTrends), articles.length, readTimeMinutes]
  );

  return {
    id: result[0].id,
    date,
    articleCount: articles.length,
    keyTrends,
    executiveSummary,
  };
}
