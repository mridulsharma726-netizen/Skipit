const path = require('path');
const dotenv = require('dotenv');

// Load root .env or local .env
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  wsPort: process.env.WS_PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'skipit_super_secret_jwt_key_2026_peer_to_peer',
  supabase: {
    url: process.env.SUPABASE_URL || 'https://uhrskxkgbpzzanehwefm.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5000').split(','),
};

module.exports = config;
