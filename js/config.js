/**
 * config.js — konfiguracja Supabase
 *
 * SUPABASE_URL i SUPABASE_ANON_KEY to dane publiczne (anon key).
 * Bezpieczeństwo zapewnia Row Level Security (RLS) po stronie Supabase.
 *
 * INSTRUKCJA:
 * 1. Wejdź na supabase.com → Twój projekt → Settings → API
 * 2. Skopiuj "Project URL" i "anon public" key
 * 3. Wklej poniżej
 */

// eslint-disable-next-line no-unused-vars
const SUPABASE_CONFIG = {
  url: "https://tvtzexldhgsnmsmxsipd.supabase.co", // ← zamień na swój URL
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dHpleGxkaGdzbm1zbXhzaXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTI2ODYsImV4cCI6MjA4OTc4ODY4Nn0.cilOsWBcJt46NVirWo0Y65UBXtG12vFHZzxI_a-OLJE", // ← zamień na swój anon key
}

