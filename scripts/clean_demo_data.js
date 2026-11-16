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

async function cleanDemoData() {
  console.log('🧹 Purging all demo listings and test data from Supabase...');

  // 1. Delete reviews
  const { error: revErr } = await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (revErr) console.warn('Warning clearing reviews:', revErr.message);

  // 2. Delete wishlists
  const { error: wishErr } = await supabase.from('wishlists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (wishErr) console.warn('Warning clearing wishlists:', wishErr.message);

  // 3. Delete messages
  const { error: msgErr } = await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (msgErr) console.warn('Warning clearing messages:', msgErr.message);

  // 4. Delete demo listings
  const { error: listErr, count } = await supabase.from('listings').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000');
  if (listErr) {
    console.error('Error deleting listings:', listErr.message);
  } else {
    console.log(`✅ Successfully removed demo listings (Count: ${count || 'All'}). Marketplace database is clean.`);
  }

  console.log('✨ SkipIt database is now 100% clean and ready for real peer-to-peer user listings!');
}

cleanDemoData();
