import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/*
  Service-role client — BYPASSES RLS. Use ONLY for trusted server-side writes
  that the user cannot perform under their own policies: payment/webhook
  processing, capacity reservation, ticket issuance, payouts (CLAUDE.md §4.5).

  The `server-only` import makes any attempt to bundle this into client code a
  build error. Never pass this client, or the key, to the browser.
*/
export function createServiceClient() {
  return createSupabaseClient<Database>(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
