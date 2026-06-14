import { createBrowserClient } from "@supabase/ssr";

// Frontend uses Supabase ONLY for Auth (sign in/up, session/JWT).
// Per CLAUDE.md, the frontend must NEVER query Postgres directly — all data
// access goes through the Go REST API, which validates the JWT minted here.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env.local and set " +
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

