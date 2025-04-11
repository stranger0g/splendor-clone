import { createClient } from '@supabase/supabase-js'

// Access environment variables using import.meta.env in Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Add a check to ensure variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing!");
  console.error("VITE_SUPABASE_URL:", supabaseUrl ? "Loaded" : "Missing");
  console.error("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Loaded" : "Missing");
  // Optionally throw an error in development
  if (import.meta.env.DEV) {
      throw new Error("Supabase URL and/or Anon Key are missing. Check your .env.local file and ensure variable names start with VITE_");
  }
}

// Initialize and export the client
// Add a check to prevent client creation if variables are missing in production
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null; // Or handle this case more gracefully

// Optional: Log successful initialization in development
if (import.meta.env.DEV && supabase) {
  console.log("Supabase client initialized successfully.");
} else if (import.meta.env.DEV && !supabase) {
  console.error("Supabase client initialization failed due to missing env vars.");
}