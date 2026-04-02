import { Queue } from 'bullmq';
import { getRedis } from '../../infrastructure/cache/redis';
import { query } from '../../infrastructure/database/db';
import { fetchRSSFeed } from './sources/rss';
import { fetchNewsAPI } from './sources/newsapi';
import { fetchArxiv } from './sources/arxiv';
import { fetchHackerNews } from './sources/hackernews';
import { storeRawArticle } from './deduplication';
import { Source, RawArticle, IngestionResult } from './types';
import sourcesConfig from '../../../../../config/sources.json';

let processingQueue: Queue | null = null;

function getProcessingQueue(): Queue {
  if (!processingQueue) {
    processingQueue = new Queue('article-processing', {
      connection: getRedis(),
    });
  }
  return processingQueue;
}

async function fetchFromSource(source: Source): Promise<RawArticle[]> {
  const cfg = source.config as Record<string, unknown>;

  switch (source.type) {
    case 'rss':
      return fetchRSSFeed(source.id, cfg.url as string, (cfg.maxItems as number) ?? 20);

    case 'newsapi':
      return fetchNewsAPI(
        source.id,
        cfg.query as string,
        (cfg.language as string) ?? 'en',
        (cfg.sortBy as string) ?? 'publishedAt'
      );

    case 'arxiv':
      return fetchArxiv(
        source.id,
        (cfg.categories as string[]) ?? ['cs.AI'],
        (cfg.maxResults as number) ?? 50
      );

    case 'hackernews':
      return fetchHackerNews(
        source.id,
        (cfg.minScore as number) ?? 50,
        (cfg.aiKeywords as string[]) ?? []
      );

    case 'guardian':
      // Guardian uses NewsAPI-compatible format via its own endpoint
      return [];

    default:
      return [];
  }
}

export async function pollSource(sourceId: string): Promise<IngestionResult> {
  const source = (sourcesConfig.sources as Source[]).find((s) => s.id === sourceId);
  if (!source || !source.enabled) {
    return { sourceId, fetched: 0, stored: 0, duplicates: 0, errors: 0 };
  }

  let fetched = 0;
  let stored = 0;
  let duplicates = 0;
  let errors = 0;

  try {
    const articles = await fetchFromSource(source);
    fetched = articles.length;

    for (const article of articles) {
      if (!article.url || !article.title) continue;
      try {
        const id = await storeRawArticle(article);
        if (id) {
          stored++;
          // Queue for AI processing
          await getProcessingQueue().add(
            'process-article',
            { rawArticleId: id },
            { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
          );
        } else {
          duplicates++;
        }
      } catch (err) {
        errors++;
        console.error(`Error storing article from ${sourceId}:`, (err as Error).message);
      }
    }

    // Update last_polled_at
    await query(
      'UPDATE sources SET last_polled_at = NOW() WHERE id = $1',
      [sourceId]
    );
  } catch (err) {
    console.error(`Error polling source ${sourceId}:`, (err as Error).message);
    errors++;
  }

  console.log(`[Poller] ${sourceId}: fetched=${fetched} stored=${stored} dupes=${duplicates} errors=${errors}`);
  return { sourceId, fetched, stored, duplicates, errors };
}

export async function pollAllSources(): Promise<IngestionResult[]> {
  const enabledSources = (sourcesConfig.sources as Source[]).filter((s) => s.enabled);
  const results = await Promise.allSettled(
    enabledSources.map((s) => pollSource(s.id))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<IngestionResult> => r.status === 'fulfilled')
    .map((r) => r.value);
}
