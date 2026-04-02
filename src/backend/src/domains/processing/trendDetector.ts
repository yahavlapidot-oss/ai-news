import { query } from '../../infrastructure/database/db';
import { cacheSet } from '../../infrastructure/cache/redis';

interface TopicCount {
  topic: string;
  count: string;
}

/**
 * Computes velocity for each topic over two 3-hour windows:
 *   velocity = (current_3h - prev_3h) / max(prev_3h, 1)
 *
 * velocity > 1.0 = topic doubled in mentions → breaking signal
 * velocity > 0.5 = emerging trend
 */
export async function detectTrends(): Promise<void> {
  const now = new Date();
  const windowEnd = now;
  const windowMid = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const windowStart = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  // Count current 3h window
  const currentCounts = await query<TopicCount>(
    `SELECT unnest(related_topics) as topic, COUNT(*) as count
     FROM articles
     WHERE processed_at BETWEEN $1 AND $2
     GROUP BY topic
     HAVING COUNT(*) >= 2`,
    [windowMid.toISOString(), windowEnd.toISOString()]
  );

  // Count previous 3h window
  const prevCounts = await query<TopicCount>(
    `SELECT unnest(related_topics) as topic, COUNT(*) as count
     FROM articles
     WHERE processed_at BETWEEN $1 AND $2
     GROUP BY topic`,
    [windowStart.toISOString(), windowMid.toISOString()]
  );

  const prevMap = new Map(prevCounts.map((r) => [r.topic, parseInt(r.count)]));

  const velocityResults = currentCounts.map((r) => {
    const current = parseInt(r.count);
    const prev = prevMap.get(r.topic) ?? 0;
    const velocity = (current - prev) / Math.max(prev, 1);
    return {
      topic: r.topic,
      currentCount: current,
      prevCount: prev,
      velocity,
      isBreaking: velocity >= 1.0,
    };
  }).sort((a, b) => b.velocity - a.velocity);

  // Persist top signals
  for (const signal of velocityResults.slice(0, 20)) {
    await query(
      `INSERT INTO topic_velocity
         (topic, window_start, window_end, article_count, velocity_score, is_breaking)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        signal.topic,
        windowStart.toISOString(),
        windowEnd.toISOString(),
        signal.currentCount,
        signal.velocity,
        signal.isBreaking,
      ]
    );
  }

  // Cache top 10 for fast API response
  await cacheSet('trends:velocity', velocityResults.slice(0, 10), 180);

  const breaking = velocityResults.filter((s) => s.isBreaking);
  if (breaking.length > 0) {
    console.log(`[TrendDetector] Breaking signals: ${breaking.map((s) => s.topic).join(', ')}`);
  }
}

/**
 * Called every 30 minutes via cron.
 */
export function startTrendDetector(): void {
  const intervalMs = 30 * 60 * 1000;
  setInterval(async () => {
    try {
      await detectTrends();
    } catch (err) {
      console.error('[TrendDetector] Error:', (err as Error).message);
    }
  }, intervalMs);

  // Run once on startup
  detectTrends().catch(console.error);
  console.log('[TrendDetector] Started — interval: 30 min');
}
