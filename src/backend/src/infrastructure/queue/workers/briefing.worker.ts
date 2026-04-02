import cron from 'node-cron';
import { buildDailyBriefing } from '../../../domains/delivery/briefingBuilder';

/**
 * Builds the daily briefing every morning at 6:00 AM.
 */
export function startBriefingScheduler(): void {
  const cronExpr = process.env.BRIEFING_CRON ?? '0 6 * * *';

  cron.schedule(cronExpr, async () => {
    const today = new Date().toISOString().slice(0, 10);
    console.log(`[BriefingWorker] Building briefing for ${today}...`);
    try {
      const briefing = await buildDailyBriefing(today);
      console.log(
        `[BriefingWorker] Briefing built — articles:${briefing.articleCount} trends:${briefing.keyTrends.length}`
      );
    } catch (err) {
      console.error('[BriefingWorker] Failed to build briefing:', (err as Error).message);
    }
  });

  console.log(`[BriefingWorker] Scheduled — cron: ${cronExpr}`);
}
