import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Extremely flexible environment variable detection
const supabaseUrl = process.env.SUPABASE_URL || process.env.Project_URL || process.env.PROJECT_URL || process.env.supabase_url;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.supabase_anon_key;

console.log('Environment Check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  port: process.env.PORT
});

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL ERROR: Supabase credentials are missing!');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

export { supabase };
