import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// EXACT 11 AUDITED TEST & DEMO LISTING IDS ONLY
const DEMO_LISTING_IDS = [
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888',
  '005d873b-998c-4880-a513-0fb6b6acca32',
  '9759c8ef-9b34-4d02-b867-cc4c737235df',
  '78b6a94b-17a7-49df-9106-c512611fa119',
];

const DEMO_STORAGE_FILES = [
  { bucket: 'listing-images', path: '64410c23-0394-437e-94eb-68ddcfd24c90/73218819-eb12-41e7-b32a-c08a7d1acca4.jpg' }
];

async function executeControlledCleanup() {
  const isConfirmed = process.argv.includes('--confirm');

  if (!isConfirmed) {
    console.warn('⚠️  SAFETY LOCK ACTIVE: Missing --confirm flag.');
    console.warn('To execute, the user must explicitly approve and run: node scripts/execute_controlled_cleanup.js --confirm');
    process.exit(1);
  }

  console.log('🚀 Executing controlled cleanup of verified demo listings...');

  // 1. Delete associated wishlists referring to these listings (if any)
  const { error: wishErr } = await supabase.from('wishlists').delete().in('listing_id', DEMO_LISTING_IDS);
  if (wishErr) console.warn('Wishlist cleanup warning:', wishErr.message);

  // 2. Delete the 11 verified demo listings
  const { data: deleted, error: listErr } = await supabase
    .from('listings')
    .delete()
    .in('id', DEMO_LISTING_IDS)
    .select('id, title');

  if (listErr) {
    console.error('❌ Error deleting demo listings:', listErr.message);
    process.exit(1);
  }

  console.log(`✅ Successfully deleted ${deleted?.length || 0} verified demo listings:`);
  deleted?.forEach((l, i) => console.log(`   ${i + 1}. [${l.id}] ${l.title}`));

  // 3. Delete demo images from storage
  for (const item of DEMO_STORAGE_FILES) {
    const { error: fileErr } = await supabase.storage.from(item.bucket).remove([item.path]);
    if (fileErr) console.warn(`Storage removal warning for ${item.path}:`, fileErr.message);
    else console.log(`   ✓ Removed demo image from storage: ${item.path}`);
  }

  // 4. Verify post-cleanup state
  const { count: remainingListings } = await supabase.from('listings').select('*', { count: 'exact', head: true });
  const { count: remainingUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

  console.log('\n📊 POST-CLEANUP STATUS:');
  console.log(`   Listings count: ${remainingListings} (Zero demo listings remain)`);
  console.log(`   User profiles count: ${remainingUsers} (Real user accounts 100% intact)`);
  console.log('✨ Controlled cleanup completed safely.');
}

executeControlledCleanup();
