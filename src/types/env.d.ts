declare module '@env' {
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
  // Legacy – was used for Gemini; kept for backward compatibility.
  export const GEMINI_API_KEY: string;

  // New primary LLM provider (Nebius / OpenAI-compatible)
  export const NEBIUS_API_KEY: string;
}

