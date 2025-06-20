
import type { Database } from '@/lib/database.types';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// console.log('[SupabaseClient] Initializing Supabase client...'); // Removed
// console.log('[SupabaseClient] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Loaded' : 'MISSING or UNDEFINED'); // Removed
// console.log('[SupabaseClient] NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Loaded (partially hidden)' : 'MISSING or UNDEFINED'); // Removed
// if (supabaseAnonKey) { // Removed
//   console.log('[SupabaseClient] Anon Key (first 5 chars):', supabaseAnonKey.substring(0,5)); // Removed
// }

if (!supabaseUrl || !supabaseAnonKey) {
  // console.error('[SupabaseClient] CRITICAL ERROR: Supabase URL or Anon Key is missing.'); // Removed
  // console.error('[SupabaseClient] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl); // Removed
  // console.error('[SupabaseClient] NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey); // Removed
  throw new Error(
    'Supabase URL or Anon Key is missing from environment variables. NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY are undefined. See SERVER CONSOLE logs for details. If using Firebase Studio, check its specific documentation for setting local development environment variables, as .env.local might be insufficient.'
  );
}

export const supabase = createBrowserClient<Database>(
  supabaseUrl!,
  supabaseAnonKey!
);

// console.log('[SupabaseClient] Supabase client instance created.'); // Removed
