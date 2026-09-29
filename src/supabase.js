import { createClient } from "@supabase/supabase-js";

// Values come from the .env file (see .env.example)
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
