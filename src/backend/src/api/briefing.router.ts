import { Router, Request, Response } from 'express';
import { query, queryOne } from '../infrastructure/database/db';
import { cacheGet, cacheSet } from '../infrastructure/cache/redis';
import { buildDailyBriefing } from '../domains/delivery/briefingBuilder';
import { composeFeed } from '../domains/delivery/feedComposer';

export const briefingRouter = Router();

interface BriefingRow {
  id: string;
  date: string;
  headline_article_ids: string[];
  executive_summary: string;
  key_trends: string;
  article_count: number;
  read_time_minutes: number;
  built_at: string;
}

// GET /api/briefing — today's briefing (or a specific date)
briefingRouter.get('/', async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) ?? new Date().toISOString().slice(0, 10);
    const cacheKey = `briefing:${date}`;

    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    let briefing = await queryOne<BriefingRow>(
      'SELECT * FROM daily_briefings WHERE date = $1',
      [date]
    );

    // Build on-demand if missing
    if (!briefing) {
      await buildDailyBriefing(date);
      briefing = await queryOne<BriefingRow>(
        'SELECT * FROM daily_briefings WHERE date = $1',
        [date]
      );
    }

    if (!briefing) return res.status(404).json({ error: 'No briefing for this date' });

    // Fetch headline articles
    const headlineIds = briefing.headline_article_ids ?? [];
    const headlines = headlineIds.length > 0
      ? await composeFeed({ limit: 5 })
      : [];

    const response = {
      id: briefing.id,
      date: briefing.date,
      readTimeMinutes: briefing.read_time_minutes,
      executiveSummary: briefing.executive_summary,
      keyTrends: JSON.parse(briefing.key_trends ?? '[]'),
      articleCount: briefing.article_count,
      headlines,
      builtAt: briefing.built_at,
    };

    await cacheSet(cacheKey, response, 300); // 5 min TTL
    return res.json(response);
  } catch (err) {
    console.error('[briefingRouter] GET /', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/briefing/history — list of available briefing dates
briefingRouter.get('/history', async (_req: Request, res: Response) => {
  try {
    const rows = await query<{ date: string; article_count: number }>(
      'SELECT date, article_count FROM daily_briefings ORDER BY date DESC LIMIT 30'
    );
    return res.json(rows);
  } catch (err) {
    console.error('[briefingRouter] GET /history', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
