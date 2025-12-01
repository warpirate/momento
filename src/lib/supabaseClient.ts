import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase environment variables are missing. Create a .env file based on env.example.',
  );
}

// Use the Supabase URL directly without any protocol manipulation
const supabaseUrl = SUPABASE_URL.startsWith('http')
  ? SUPABASE_URL
  : `https://${SUPABASE_URL}`;

export const supabase = createClient(supabaseUrl, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

