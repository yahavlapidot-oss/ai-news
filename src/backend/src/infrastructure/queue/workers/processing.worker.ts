import { Worker, Job } from 'bullmq';
import { getRedis } from '../../cache/redis';
import { query, queryOne } from '../../database/db';
import { extractCleanText, truncateForProcessing } from '../../../domains/processing/extractor';
import { analyzeArticle } from '../../../domains/processing/analyzer';
import { hashContent } from '../../../domains/ingestion/deduplication';

interface ProcessingJob {
  rawArticleId: string;
}

interface RawArticleRow {
  id: string;
  source_id: string;
  url: string;
  title: string;
  raw_content: string;
  author: string;
  published_at: string;
}

async function processArticle(job: Job<ProcessingJob>): Promise<void> {
  const { rawArticleId } = job.data;

  const raw = await queryOne<RawArticleRow>(
    'SELECT * FROM raw_articles WHERE id = $1',
    [rawArticleId]
  );

  if (!raw) {
    throw new Error(`Raw article not found: ${rawArticleId}`);
  }

  // Mark as processing
  await query(
    'UPDATE raw_articles SET processing_status = $1 WHERE id = $2',
    ['processing', rawArticleId]
  );

  try {
    const cleanContent = extractCleanText(raw.raw_content ?? '');
    const contentForAI = truncateForProcessing(cleanContent);

    const analysis = await analyzeArticle(raw.title, contentForAI || raw.title);
    const contentHash = hashContent(cleanContent);

    // Check for near-duplicate by content hash
    const nearDupe = await queryOne<{ id: string }>(
      'SELECT id FROM articles WHERE content_hash = $1 LIMIT 1',
      [contentHash]
    );

    if (nearDupe) {
      await query(
        'UPDATE raw_articles SET processing_status = $1 WHERE id = $2',
        ['duplicate', rawArticleId]
      );
      return;
    }

    await query(
      `INSERT INTO articles (
        raw_article_id, source_id, url, title, clean_content,
        summary, key_takeaways, category, importance_score,
        importance_reason, is_breakthrough, related_topics,
        author, published_at, content_hash
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      ON CONFLICT (url) DO NOTHING`,
      [
        rawArticleId,
        raw.source_id,
        raw.url,
        raw.title,
        cleanContent,
        analysis.summary,
        JSON.stringify(analysis.keyTakeaways),
        analysis.category,
        analysis.importanceScore,
        analysis.importanceReason,
        analysis.isBreakthrough,
        JSON.stringify(analysis.relatedTopics),
        raw.author ?? '',
        raw.published_at ?? null,
        contentHash,
      ]
    );

    await query(
      'UPDATE raw_articles SET processing_status = $1 WHERE id = $2',
      ['done', rawArticleId]
    );
  } catch (err) {
    await query(
      'UPDATE raw_articles SET processing_status = $1, processing_error = $2 WHERE id = $3',
      ['failed', (err as Error).message, rawArticleId]
    );
    throw err;
  }
}

export function startProcessingWorker(): Worker {
  const worker = new Worker<ProcessingJob>(
    'article-processing',
    processArticle,
    {
      connection: getRedis(),
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[ProcessingWorker] Done: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[ProcessingWorker] Failed: ${job?.id}`, err.message);
  });

  return worker;
}
