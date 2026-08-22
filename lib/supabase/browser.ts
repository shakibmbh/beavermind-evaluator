"use client";

import { createClient } from "@supabase/supabase-js";

// Anon-key client for the browser. RLS on `runs` only allows SELECT,
// so this can safely be shipped to the client to power the live status
// subscription on the /run/[id] page. See server.ts for why this is
// deliberately untyped at the client level.
export function supabaseBrowser() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
