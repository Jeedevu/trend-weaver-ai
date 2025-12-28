import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrendingContentRequest {
  topic: string;
  visual_style: string;
  voice_persona: string;
  language?: string;
  platforms?: string[];
}

const SYSTEM_PROMPT = `You are an expert viral content creator for YouTube Shorts. Your job is to generate trending, engaging content that drives views and engagement.

RULES:
- Create content that hooks viewers in the first 2 seconds
- Use curiosity gaps and pattern interrupts
- Optimize for the YouTube Shorts algorithm
- Keep titles under 60 characters, punchy and clickable
- Descriptions should be keyword-rich but natural
- Include 5-8 relevant trending hashtags
- Scripts must be 30-40 words maximum, spoken naturally

OUTPUT FORMAT (JSON):
{
  "title": "catchy title for YouTube Shorts",
  "description": "engaging description with keywords",
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "script": "the actual spoken script for the video",
  "hook": "the first sentence that hooks viewers",
  "topic_angle": "unique angle or twist on the topic"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, visual_style, voice_persona, language = 'en', platforms = ['youtube'] } = await req.json() as TrendingContentRequest;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating trending content for topic:', topic);

    const userPrompt = `Generate viral YouTube Shorts content for this topic: "${topic}"

Context:
- Visual Style: ${visual_style}
- Voice Persona: ${voice_persona}
- Language: ${language}
- Target Platforms: ${platforms.join(', ')}

Create a unique, trending angle that will maximize views and engagement. The content should feel fresh and timely, not generic.

Return valid JSON only, no markdown.`;

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
    const contentString = data.choices?.[0]?.message?.content?.trim() || '';
    
    // Parse the JSON response
    let content;
    try {
      // Remove markdown code blocks if present
      const cleanedString = contentString.replace(/```json\n?|\n?```/g, '').trim();
      content = JSON.parse(cleanedString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', contentString);
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('Generated trending content:', {
      title: content.title,
      topic_angle: content.topic_angle,
      script_words: content.script?.split(/\s+/).length
    });

    return new Response(JSON.stringify({
      success: true,
      content: {
        title: content.title,
        description: content.description,
        hashtags: content.hashtags || [],
        script: content.script,
        hook: content.hook,
        topic_angle: content.topic_angle,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-trending-content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
