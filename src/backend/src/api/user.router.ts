import { Router, Request, Response } from 'express';
import { query, queryOne } from '../infrastructure/database/db';
import { v4 as uuidv4 } from 'uuid';

export const userRouter = Router();

interface UserPrefsRow {
  user_id: string;
  subscribed_categories: string;
  notification_enabled: boolean;
  briefing_time: string;
  content_depth: string;
}

// GET /api/user/:userId/preferences
userRouter.get('/:userId/preferences', async (req: Request, res: Response) => {
  try {
    const prefs = await queryOne<UserPrefsRow>(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [req.params.userId]
    );

    if (!prefs) return res.status(404).json({ error: 'User not found' });

    return res.json({
      userId: prefs.user_id,
      subscribedCategories: JSON.parse(prefs.subscribed_categories ?? '[]'),
      notificationEnabled: prefs.notification_enabled,
      briefingTime: prefs.briefing_time,
      contentDepth: prefs.content_depth,
    });
  } catch (err) {
    console.error('[userRouter] GET preferences', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user/:userId/preferences
userRouter.put('/:userId/preferences', async (req: Request, res: Response) => {
  try {
    const { subscribedCategories, notificationEnabled, briefingTime, contentDepth } = req.body;

    await query(
      `INSERT INTO user_preferences (user_id, subscribed_categories, notification_enabled, briefing_time, content_depth)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         subscribed_categories = EXCLUDED.subscribed_categories,
         notification_enabled = EXCLUDED.notification_enabled,
         briefing_time = EXCLUDED.briefing_time,
         content_depth = EXCLUDED.content_depth,
         updated_at = NOW()`,
      [
        req.params.userId,
        JSON.stringify(subscribedCategories ?? []),
        notificationEnabled ?? true,
        briefingTime ?? '07:00',
        contentDepth ?? 'summary',
      ]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[userRouter] PUT preferences', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/user — create anonymous user
userRouter.post('/', async (_req: Request, res: Response) => {
  try {
    const userId = uuidv4();

    await query('INSERT INTO users (id) VALUES ($1)', [userId]);
    await query('INSERT INTO user_preferences (user_id) VALUES ($1)', [userId]);

    return res.status(201).json({ userId });
  } catch (err) {
    console.error('[userRouter] POST /', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/user/:userId/interactions — track read/save
userRouter.post('/:userId/interactions', async (req: Request, res: Response) => {
  try {
    const { articleId, action } = req.body; // action: 'read' | 'save' | 'unsave'

    if (!articleId) return res.status(400).json({ error: 'articleId required' });

    if (action === 'read' || action === 'save') {
      await query(
        `INSERT INTO reading_history (user_id, article_id, saved)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, article_id) DO UPDATE SET
           saved = EXCLUDED.saved,
           read_at = NOW()`,
        [req.params.userId, articleId, action === 'save']
      );
    } else if (action === 'unsave') {
      await query(
        `UPDATE reading_history SET saved = FALSE WHERE user_id = $1 AND article_id = $2`,
        [req.params.userId, articleId]
      );
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[userRouter] POST interactions', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/user/:userId/saved — saved articles
userRouter.get('/:userId/saved', async (req: Request, res: Response) => {
  try {
    const rows = await query<{ article_id: string; read_at: string }>(
      `SELECT rh.article_id, rh.read_at,
              a.title, a.summary, a.category, a.importance_score, a.url, a.published_at
       FROM reading_history rh
       JOIN articles a ON a.id = rh.article_id
       WHERE rh.user_id = $1 AND rh.saved = TRUE
       ORDER BY rh.read_at DESC
       LIMIT 50`,
      [req.params.userId]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[userRouter] GET saved', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
