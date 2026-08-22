import { createClient } from "@supabase/supabase-js";

// Service-role client: full read/write on `runs`, bypasses RLS.
// Only ever import this from server-side code (API routes, Inngest
// functions). Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
//
// Deliberately untyped at the client level (no Database generic) rather
// than fighting @supabase/supabase-js's generated-types generic shape,
// which is strict and version-sensitive. Call sites use RunRow directly
// (see lib/supabase/types.ts) and cast where needed -- simpler to keep
// correct than a hand-maintained Database type that silently drifts from
// postgrest-js's internal GenericTable shape.
export function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false }
  });
}
