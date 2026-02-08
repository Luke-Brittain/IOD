/**
 * lib/supabase/client.ts
 * Lightweight Supabase client factory for server-side usage.
 * This module keeps usage server-only; do not import from client components.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseServer: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (supabaseServer) return supabaseServer;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase credentials not found. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.');
  }

  supabaseServer = createClient(url, key, {
    auth: { persistSession: false },
  });

  return supabaseServer;
}
