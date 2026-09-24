declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    FEEDBACK_OWNER_EMAIL?: string;
    OWNER_AUTH_MODE?: "sites" | "disabled";
    DATA_BACKEND?: "d1" | "supabase";
    SUPABASE_URL?: string;
    SUPABASE_SECRET_KEY?: string;
  }
}
