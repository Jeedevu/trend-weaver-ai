import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map our voice IDs to ElevenLabs voice IDs
const VOICE_MAP: Record<string, string> = {
  echo: "CwhRBWXzGAHq8TQ4Fs17", // Roger - Male, American, Excited
  alloy: "EXAVITQu4vr4xnSDxMaL", // Sarah - Female, American
  onyx: "JBFqnCBsd6RMkjVDRZzb", // George - Male, American, Slow, Deep
  fable: "FGY2WhTYpPnrIDTdsKH5", // Laura - Female, British
  nova: "XrExE9yKIg1WjnnlVkGX", // Matilda - Female, American, Warm
  shimmer: "pFZP5JQG7iQjIQuC4Bku", // Lily - Female, Soft, Gentle
};

// Sample text for voice preview
const PREVIEW_TEXT = "Welcome to AutoShorts! I'll be narrating your videos with this voice. Let me know if you like how I sound.";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { voiceId } = await req.json();
    
    console.log("Voice preview requested for:", voiceId);
    
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Voice service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the ElevenLabs voice ID
    const elevenLabsVoiceId = VOICE_MAP[voiceId] || VOICE_MAP.echo;
    
    console.log("Using ElevenLabs voice ID:", elevenLabsVoiceId);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: PREVIEW_TEXT,
          model_id: "eleven_turbo_v2_5",
          output_format: "mp3_44100_128",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate voice preview" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Voice preview generated successfully");

    // Return the audio directly as binary
    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Voice preview error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
