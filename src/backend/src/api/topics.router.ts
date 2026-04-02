import { Router, Request, Response } from 'express';
import { query } from '../infrastructure/database/db';
import { cacheGet, cacheSet } from '../infrastructure/cache/redis';
import { composeFeed } from '../domains/delivery/feedComposer';
import { Category } from '../domains/processing/types';
import categoriesConfig from '../../../../config/categories.json';

export const topicsRouter = Router();

// GET /api/topics — category breakdown with article counts
topicsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'topics:breakdown';
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const counts = await query<{ category: string; count: string }>(
      `SELECT category, COUNT(*) as count
       FROM articles
       WHERE processed_at >= NOW() - INTERVAL '7 days'
       GROUP BY category
       ORDER BY count DESC`
    );

    const countMap = Object.fromEntries(
      counts.map((r) => [r.category, parseInt(r.count)])
    );

    const response = categoriesConfig.categories.map((cat) => ({
      ...cat,
      articleCount: countMap[cat.id] ?? 0,
    }));

    await cacheSet(cacheKey, response, 300);
    return res.json(response);
  } catch (err) {
    console.error('[topicsRouter] GET /', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/topics/:category — articles for a specific category
topicsRouter.get('/:category', async (req: Request, res: Response) => {
  try {
    const category = req.params.category as Category;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    const items = await composeFeed({ categories: [category], limit, offset, minImportance: 1 });
    return res.json(items);
  } catch (err) {
    console.error('[topicsRouter] GET /:category', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/topics/trends/signals — trending topics
topicsRouter.get('/trends/signals', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'trends:signals';
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    // Detect trending: topics appearing 3+ times in last 6 hours with growing velocity
    const rows = await query<{ topic: string; count: string; latest: string }>(
      `SELECT unnest(related_topics) as topic, COUNT(*) as count, MAX(processed_at) as latest
       FROM articles
       WHERE processed_at >= NOW() - INTERVAL '6 hours'
       GROUP BY topic
       HAVING COUNT(*) >= 2
       ORDER BY count DESC
       LIMIT 10`
    );

    const signals = rows.map((r) => ({
      topic: r.topic,
      articleCount: parseInt(r.count),
      latestAt: r.latest,
    }));

    await cacheSet(cacheKey, signals, 120);
    return res.json(signals);
  } catch (err) {
    console.error('[topicsRouter] GET /trends/signals', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
