import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a script generator for short-form videos (YouTube Shorts). You MUST follow these constraints:

HARD RULES:
- Maximum 40 words
- Hook must be in first 2 seconds (first sentence)
- Spoken English only
- NO emojis
- NO generic advice
- NO motivational fluff
- NO questions at the end

STRUCTURE (choose one):
1. Hook + Fact: Question hook → Surprising answer → Implication
2. POV Reveal: "POV:" statement → Revelation → Lasting implication
3. This vs That: Comparison setup → Key differences → Clear winner
4. Top 3 Facts: Category intro → Three facts → Call to action

OUTPUT: Return ONLY the script text, nothing else. No explanations, no formatting, just the spoken words.`;

interface TemplateInstructions {
  [key: string]: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, template } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const templateInstructions: TemplateInstructions = {
      hook_fact: "Use the Hook + Fact structure: Start with a question hook, give a surprising answer, end with implications.",
      pov_reveal: "Use the POV Reveal structure: Start with 'POV:', reveal something surprising, end with lasting implication.",
      comparison: "Use the This vs That structure: Set up a comparison, list key differences, declare a clear winner.",
      countdown: "Use the Top 3 Facts structure: Introduce the category, list three facts, end with a call to action like 'Follow for more'."
    };

    const templateKey = template as string || 'hook_fact';
    const selectedTemplate = templateInstructions[templateKey] || templateInstructions.hook_fact;

    const userPrompt = `Generate a short-form video script about: ${topic}

Template: ${selectedTemplate}

Remember: Max 40 words, hook in first sentence, no emojis, spoken English only.`;

    console.log('Generating script for topic:', topic, 'with template:', template);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const scriptContent = data.choices?.[0]?.message?.content?.trim() || '';
    
    // Count words
    const wordCount = scriptContent.split(/\s+/).filter((word: string) => word.length > 0).length;
    
    // Extract hook (first sentence)
    const hookMatch = scriptContent.match(/^[^.!?]+[.!?]/);
    const hookText = hookMatch ? hookMatch[0].trim() : scriptContent.split(' ').slice(0, 8).join(' ');

    console.log('Generated script:', { wordCount, hookText: hookText.substring(0, 50) });

    return new Response(JSON.stringify({
      content: scriptContent,
      wordCount,
      hookText,
      template,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-script function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
