import crypto from 'crypto';
import { query, queryOne } from '../../infrastructure/database/db';

export function hashUrl(url: string): string {
  return crypto.createHash('sha256').update(url.trim().toLowerCase()).digest('hex');
}

export function hashContent(content: string): string {
  // Normalize: lowercase, strip whitespace, take first 1000 chars
  const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 1000);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export async function isDuplicate(url: string): Promise<boolean> {
  const urlHash = hashUrl(url);
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM raw_articles WHERE url_hash = $1 LIMIT 1',
    [urlHash]
  );
  return existing !== null;
}

export async function storeRawArticle(article: {
  sourceId: string;
  url: string;
  title: string;
  rawContent?: string;
  author?: string;
  publishedAt?: Date;
}): Promise<string | null> {
  const urlHash = hashUrl(article.url);

  // Check for URL duplicate
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM raw_articles WHERE url_hash = $1',
    [urlHash]
  );
  if (existing) return null; // duplicate

  const result = await query<{ id: string }>(
    `INSERT INTO raw_articles (source_id, url, url_hash, title, raw_content, author, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (url) DO NOTHING
     RETURNING id`,
    [
      article.sourceId,
      article.url,
      urlHash,
      article.title,
      article.rawContent ?? '',
      article.author ?? '',
      article.publishedAt ?? null,
    ]
  );

  return result[0]?.id ?? null;
}
