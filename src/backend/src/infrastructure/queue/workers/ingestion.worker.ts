import cron from 'node-cron';
import { pollAllSources, pollSource } from '../../../domains/ingestion/poller';

/**
 * Schedules periodic source polling.
 * Default: every 15 minutes.
 */
export function startIngestionScheduler(): void {
  const interval = process.env.INGESTION_INTERVAL_MINUTES ?? '15';

  // Poll all sources on a cron schedule
  cron.schedule(`*/${interval} * * * *`, async () => {
    console.log('[IngestionWorker] Starting poll cycle...');
    try {
      const results = await pollAllSources();
      const total = results.reduce(
        (acc, r) => ({
          fetched: acc.fetched + r.fetched,
          stored: acc.stored + r.stored,
          duplicates: acc.duplicates + r.duplicates,
          errors: acc.errors + r.errors,
        }),
        { fetched: 0, stored: 0, duplicates: 0, errors: 0 }
      );
      console.log(
        `[IngestionWorker] Cycle complete — fetched:${total.fetched} stored:${total.stored} dupes:${total.duplicates} errors:${total.errors}`
      );
    } catch (err) {
      console.error('[IngestionWorker] Cycle failed:', (err as Error).message);
    }
  });

  console.log(`[IngestionWorker] Scheduled — interval: ${interval} min`);
}
