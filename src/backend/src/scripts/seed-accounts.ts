import 'dotenv/config';
import { query } from '../infrastructure/database/db';
import accountsConfig from '../../../../../config/tracked-accounts.json';

async function seedAccounts() {
  console.log('Seeding tracked accounts...');

  for (const account of accountsConfig.twitter) {
    await query(
      `INSERT INTO tracked_accounts (platform, handle, display_name, tier, category)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (platform, handle) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         tier = EXCLUDED.tier,
         category = EXCLUDED.category`,
      ['twitter', account.handle, account.name, account.tier, account.category]
    );
    console.log(`  ✓ @${account.handle}`);
  }

  for (const channel of accountsConfig.youtube) {
    await query(
      `INSERT INTO tracked_accounts (platform, handle, display_name, tier)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (platform, handle) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         tier = EXCLUDED.tier`,
      ['youtube', channel.channelId, channel.name, channel.tier]
    );
    console.log(`  ✓ YouTube: ${channel.name}`);
  }

  console.log('Done seeding accounts.');
  process.exit(0);
}

seedAccounts().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
