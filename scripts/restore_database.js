import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreFromBackup(backupFileName) {
  const backupPath = path.resolve('backups', backupFileName);
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup file not found at ${backupPath}`);
    process.exit(1);
  }

  console.log(`🔄 Restoring database from ${backupPath}...`);
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

  for (const [table, rows] of Object.entries(backup.tables)) {
    if (rows.length === 0) continue;
    console.log(`Restoring ${rows.length} rows to ${table}...`);
    const { error } = await supabase.from(table).upsert(rows);
    if (error) {
      console.error(`Error restoring ${table}:`, error.message);
    } else {
      console.log(`  ✓ Table ${table} successfully restored.`);
    }
  }

  console.log('✅ Database restoration completed successfully.');
}

const target = process.argv[2];
if (target) {
  restoreFromBackup(target);
} else {
  console.log('Usage: node scripts/restore_database.js <backup_file_name.json>');
}
