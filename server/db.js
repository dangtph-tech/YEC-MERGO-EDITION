import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Extremely flexible and robust environment variable detection
const getEnv = (keys) => {
  for (const key of keys) {
    if (process.env[key]) return process.env[key].trim();
  }
  return null;
};

let supabaseUrl = getEnv(['SUPABASE_URL', 'Project_URL', 'PROJECT_URL', 'supabase_url']);
let supabaseKey = getEnv(['SUPABASE_ANON_KEY', 'SUPABASE_KEY', 'supabase_anon_key']);

// Ensure URL has protocol
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

console.log('[DB] Initialization:', {
  urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 15) : 'missing',
  hasKey: !!supabaseKey,
  rawPort: process.env.PORT
});

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL ERROR: Supabase credentials (URL or KEY) are absolute missing or empty!');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

export { supabase };
