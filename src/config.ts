declare global {
  interface Window {
    HAIRMAGIC_CONFIG?: {
      SUPABASE_URL?: string;
      SUPABASE_PUBLISHABLE_KEY?: string;
    };
  }
}

export const config = {
  supabaseUrl: window.HAIRMAGIC_CONFIG?.SUPABASE_URL?.trim() ?? "",
  supabasePublishableKey: window.HAIRMAGIC_CONFIG?.SUPABASE_PUBLISHABLE_KEY?.trim() ?? ""
};

export const isSupabaseConfigured = () => Boolean(config.supabaseUrl && config.supabasePublishableKey);
