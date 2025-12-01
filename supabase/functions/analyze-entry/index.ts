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

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

interface AnalysisResult {
  mood: string;
  activities: string[];
  people: string[];
  sentiment_score: number;
  tags: string[];
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
    const content = record?.content;

    if (!content || !entryId) {
      throw new Error('Missing content or entry ID');
    }

    // 1. Call Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Missing GEMINI_API_KEY environment variable');
    }

    const prompt = `
      Analyze the following journal entry and extract structured data.
      Return ONLY a valid JSON object with no markdown formatting.
      
      Entry: "${content}"
      
      JSON Structure:
      {
        "mood": "string (e.g., Happy, Anxious, Tired, Excited)",
        "activities": ["string", "string"],
        "people": ["string", "string"],
        "sentiment_score": number (-1.0 to 1.0),
        "tags": ["string", "string"]
      }
    `;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const geminiData = (await geminiResponse.json()) as GeminiResponse;
    
    if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Gemini Error:', JSON.stringify(geminiData));
      throw new Error('Failed to get valid response from Gemini');
    }

    const textResponse = geminiData.candidates[0].content.parts[0].text;
    
    // Clean up potential markdown code blocks if Gemini adds them
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