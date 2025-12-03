// @ts-nocheck
// This file is a Supabase Edge Function and runs in a Deno environment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RequestBody {
  record: {
    id: string;
    content: string;
  };
}

interface AnalysisResult {
  mood: string;
  activities: string[];
  people: string[];
  sentiment_score: number;
  tags: string[];
}

// Nebius returns OpenAI-compatible responses. We only care about the first choice.
interface NebiusChatCompletion {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: { message?: string };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { record } = (await req.json()) as RequestBody;
    const entryId = record?.id;
    const content = record?.content ?? '';

    if (!content.trim() || !entryId) {
      throw new Error('Missing content or entry ID');
    }

    // 1. Call Nebius (OpenAI-compatible) chat completions API
    const nebiusApiKey = Deno.env.get('NEBIUS_API_KEY');
    if (!nebiusApiKey) {
      throw new Error('Missing NEBIUS_API_KEY environment variable');
    }

    const systemPrompt =
      'You are an analysis engine for a journaling app. You MUST return ONLY valid JSON, no markdown, no prose.';

    const userPrompt = `Analyze the following journal entry and extract structured data.\nReturn ONLY a valid JSON object with no markdown formatting.\n\nEntry: "${content}"\n\nJSON Structure:\n{\n  "mood": "string (e.g., Happy, Anxious, Tired, Excited)",\n  "activities": ["string", "string"],\n  "people": ["string", "string"],\n  "sentiment_score": number (-1.0 to 1.0),\n  "tags": ["string", "string"]\n}`;

    const nebiusResponse = await fetch('https://api.tokenfactory.nebius.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nebiusApiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    const nebiusData = (await nebiusResponse.json()) as NebiusChatCompletion;

    if (!nebiusResponse.ok) {
      console.error('Nebius error response:', JSON.stringify(nebiusData));
      throw new Error(nebiusData.error?.message || `Nebius request failed with status ${nebiusResponse.status}`);
    }

    const textResponse = nebiusData.choices?.[0]?.message?.content;
    if (!textResponse) {
      console.error('Nebius missing content:', JSON.stringify(nebiusData));
      throw new Error('Failed to get valid response from Nebius');
    }

    // Clean up potential markdown code blocks if the model adds them
    const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(jsonString) as AnalysisResult;

    // 2. Save to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from('entry_signals').insert({
      entry_id: entryId,
      mood: analysis.mood,
      activities: analysis.activities,
      people: analysis.people,
      sentiment_score: analysis.sentiment_score,
      tags: analysis.tags,
    });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to save analysis: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, analysis }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in analyze-entry function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});