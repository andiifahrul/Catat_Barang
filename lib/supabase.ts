import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Kunci konfigurasi Supabase belum dipasang di .env.local!");
}

// Gunakan createBrowserClient agar cookie disinkronkan dengan server (middleware)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);