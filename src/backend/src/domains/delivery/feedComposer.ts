import { query } from '../../infrastructure/database/db';
import { Category } from '../processing/types';

export interface FeedItem {
  id: string;
  title: string;
  summary: string;
  category: Category;
  importanceScore: number;
  isBreakthrough: boolean;
  sourceId: string;
  url: string;
  author?: string;
  publishedAt?: string;
  keyTakeaways: string[];
  relatedTopics: string[];
}

interface ArticleRow {
  id: string;
  title: string;
  summary: string;
  category: string;
  importance_score: number;
  is_breakthrough: boolean;
  source_id: string;
  url: string;
  author: string;
  published_at: string;
  key_takeaways: string;
  related_topics: string;
}

function rowToFeedItem(row: ArticleRow): FeedItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    category: row.category as Category,
    importanceScore: row.importance_score,
    isBreakthrough: row.is_breakthrough,
    sourceId: row.source_id,
    url: row.url,
    author: row.author || undefined,
    publishedAt: row.published_at || undefined,
    keyTakeaways: JSON.parse(row.key_takeaways ?? '[]'),
    relatedTopics: JSON.parse(row.related_topics ?? '[]'),
  };
}

export async function composeFeed(options: {
  categories?: Category[];
  minImportance?: number;
  limit?: number;
  offset?: number;
  since?: string;
}): Promise<FeedItem[]> {
  const { categories, minImportance = 4, limit = 20, offset = 0, since } = options;

  const conditions: string[] = [`importance_score >= $1`];
  const params: unknown[] = [minImportance];
  let paramIndex = 2;

  if (categories && categories.length > 0) {
    conditions.push(`category = ANY($${paramIndex})`);
    params.push(categories);
    paramIndex++;
  }

  if (since) {
    conditions.push(`published_at >= $${paramIndex}`);
    params.push(since);
    paramIndex++;
  }

  params.push(limit, offset);

  const sql = `
    SELECT id, title, summary, category, importance_score, is_breakthrough,
           source_id, url, author, published_at, key_takeaways, related_topics
    FROM articles
    WHERE ${conditions.join(' AND ')}
    ORDER BY importance_score DESC, published_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const rows = await query<ArticleRow>(sql, params);
  return rows.map(rowToFeedItem);
}

export async function getArticleById(id: string): Promise<FeedItem | null> {
  const rows = await query<ArticleRow>(
    `SELECT id, title, summary, category, importance_score, is_breakthrough,
            source_id, url, author, published_at, key_takeaways, related_topics
     FROM articles WHERE id = $1`,
    [id]
  );
  return rows[0] ? rowToFeedItem(rows[0]) : null;
}
