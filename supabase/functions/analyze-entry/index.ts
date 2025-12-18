// @ts-nocheck
// This file is a Supabase Edge Function and runs in a Deno environment
// Repurposed: AI Enhance - rewrites journal entries before saving (no DB writes)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface RequestBody {
  content: string;
  stream?: boolean;
}

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let parsedBody: RequestBody | null = null;

  try {
    try {
      parsedBody = (await req.json()) as RequestBody;
    } catch (e) {
      console.error('Invalid JSON body:', e);
      throw new Error('Invalid JSON body');
    }

    const { content, stream = false } = parsedBody;

    if (!content?.trim()) {
      throw new Error('Missing content');
    }

    if (content.trim().length < 10) {
      throw new Error('Content too short to enhance');
    }

    const nebiusApiKey = Deno.env.get('NEBIUS_API_KEY');
    if (!nebiusApiKey) {
      throw new Error('Missing NEBIUS_API_KEY environment variable');
    }

    const systemPrompt = `You are a writing assistant for a personal journaling app.
Your task: lightly improve the user's journal entry with minimal changes.

Hard rules:
- Preserve the user's meaning, tone, and voice.
- Keep the same paragraph structure (same number of paragraphs). Do not merge paragraphs.
- Keep the same tense and point of view.
- Do NOT add new facts, events, names, dates, locations, or numbers.
- Only make small edits: grammar, punctuation, readability.
- If the user expresses emotions, make them slightly clearer in the text WITHOUT changing what they felt.
- Return ONLY the improved text. No markdown. No explanations.
`;

    const userPrompt = content;

    const wantStream = stream === true;

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
        max_tokens: 2000,
        temperature: 0.3,
        stream: wantStream,
      }),
    });

    if (!nebiusResponse.ok) {
      const rawText = await nebiusResponse.text();
      console.error('Nebius error status:', nebiusResponse.status);
      console.error('Nebius error response:', rawText);
      throw new Error(`Nebius request failed with status ${nebiusResponse.status}`);
    }

    if (!wantStream) {
      const nebiusData = (await nebiusResponse.json()) as NebiusChatCompletion;
      const enhanced = nebiusData.choices?.[0]?.message?.content?.trim();
      if (!enhanced) {
        console.error('Nebius missing content:', JSON.stringify(nebiusData));
        throw new Error('Failed to get valid response from Nebius');
      }

      return new Response(JSON.stringify({ success: true, enhanced }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!nebiusResponse.body) {
      throw new Error('Nebius response body missing');
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = nebiusResponse.body.getReader();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;

              const data = trimmed.slice('data:'.length).trim();
              if (!data) continue;
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data) as any;
                const chunk = parsed?.choices?.[0]?.delta?.content ?? '';
                if (chunk) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
                }
              } catch {
                // ignore partial/invalid lines
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('Streaming transform error:', err);
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in enhance-entry function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        request: parsedBody,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});