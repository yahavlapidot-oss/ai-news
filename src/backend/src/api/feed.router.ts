import { Router, Request, Response } from 'express';
import { cacheGet, cacheSet } from '../infrastructure/cache/redis';
import { composeFeed, getArticleById, FeedItem } from '../domains/delivery/feedComposer';
import { Category } from '../domains/processing/types';

export const feedRouter = Router();

// GET /api/feed — paginated article feed
feedRouter.get('/', async (req: Request, res: Response) => {
  try {
    const categories = req.query.categories
      ? (req.query.categories as string).split(',') as Category[]
      : undefined;
    const minImportance = parseInt(req.query.minImportance as string) || 4;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;
    const since = req.query.since as string | undefined;

    const cacheKey = `feed:${JSON.stringify({ categories, minImportance, limit, offset, since })}`;
    const cached = await cacheGet<FeedItem[]>(cacheKey);
    if (cached) return res.json(cached);

    const items = await composeFeed({ categories, minImportance, limit, offset, since });
    await cacheSet(cacheKey, items, 60); // 1 min TTL for live feed

    return res.json(items);
  } catch (err) {
    console.error('[feedRouter] GET /', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/feed/:id — single article detail
feedRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const article = await getArticleById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    return res.json(article);
  } catch (err) {
    console.error('[feedRouter] GET /:id', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
