import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ Enhanced configuration for password reset and session management
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto-refresh tokens before expiry
    autoRefreshToken: true,
    
    // Persist session across tabs and page reloads
    persistSession: true,
    
    // Detect session in URL (critical for password reset)
    detectSessionInUrl: true,
    
    // Custom storage key for auth tokens
    storageKey: 'shreephal-auth-token',
    
    // Session refresh interval (1 hour = 3600 seconds)
    refreshInterval: 3600,
  },
});
