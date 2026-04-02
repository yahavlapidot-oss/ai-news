import 'dotenv/config';
import { query } from '../infrastructure/database/db';
import sourcesConfig from '../../../../../config/sources.json';

async function seedSources() {
  console.log('Seeding sources...');

  for (const source of sourcesConfig.sources) {
    await query(
      `INSERT INTO sources (id, name, type, enabled, poll_interval_minutes, config)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         type = EXCLUDED.type,
         enabled = EXCLUDED.enabled,
         poll_interval_minutes = EXCLUDED.poll_interval_minutes,
         config = EXCLUDED.config`,
      [
        source.id,
        source.name,
        source.type,
        source.enabled,
        source.pollIntervalMinutes,
        JSON.stringify(source.config),
      ]
    );
    console.log(`  ✓ ${source.name}`);
  }

  console.log(`Seeded ${sourcesConfig.sources.length} sources.`);
  process.exit(0);
}

seedSources().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
