// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query) throw new Error('Missing query');

    const nebiusApiKey = Deno.env.get('NEBIUS_API_KEY');
    if (!nebiusApiKey) throw new Error('Missing API Key');

    // 1. Generate Embedding for Query
    const embeddingResp = await fetch('https://api.tokenfactory.nebius.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nebiusApiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small', // Ensure this matches analyze-entry
        input: query,
      }),
    });

    if (!embeddingResp.ok) {
      throw new Error(`Embedding failed: ${await embeddingResp.text()}`);
    }

    const embeddingData = await embeddingResp.json();
    const embedding = embeddingData.data?.[0]?.embedding;

    if (!embedding) throw new Error('No embedding returned');

    // 2. Search via RPC
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data: entries, error } = await supabase.rpc('match_entries', {
      query_embedding: embedding,
      match_threshold: 0.7, // Tuning parameter
      match_count: 10,
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ entries }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
