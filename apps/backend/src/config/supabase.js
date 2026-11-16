const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  console.warn('[Supabase Config] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

// Elevated client for backend operations, RLS bypass where server verifies authorization
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Standard client for public / scoped queries
const supabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

module.exports = {
  supabaseAdmin,
  supabaseClient,
};
