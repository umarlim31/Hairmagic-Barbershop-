import { createServerSupabase } from "./supabase-server";

export async function getFeedbackOwnerAccess() {
  try {
    const client = await createServerSupabase();
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return 401;
    const { data, error: ownerError } = await client.from("owner_accounts").select("user_id").eq("user_id", user.id).maybeSingle();
    if (ownerError) return 503;
    return data ? 200 : 403;
  } catch { return 503; }
}
