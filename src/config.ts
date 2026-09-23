declare global {
  interface Window {
    HAIRMAGIC_CONFIG?: {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
    };
  }
}

export const config = {
  supabaseUrl: window.HAIRMAGIC_CONFIG?.SUPABASE_URL?.trim() ?? "",
  supabaseAnonKey: window.HAIRMAGIC_CONFIG?.SUPABASE_ANON_KEY?.trim() ?? ""
};

export const isSupabaseConfigured = () => Boolean(config.supabaseUrl && config.supabaseAnonKey);
