import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JSON2VIDEO_API_KEY = Deno.env.get("JSON2VIDEO_API_KEY");
const JSON2VIDEO_BASE_URL = "https://api.json2video.com/v2";

interface VideoRequest {
  script: string;
  title: string;
  visual_style: string;
  voice_persona: string;
  series_id?: string;
}

// Map visual styles to JSON2Video compatible settings
function getVisualStyleConfig(style: string) {
  const styles: Record<string, { backgroundColor: string; textColor: string; font: string }> = {
    dark_minimal: { backgroundColor: "#0a0a0a", textColor: "#ffffff", font: "Montserrat" },
    minecraft: { backgroundColor: "#5d7c43", textColor: "#ffffff", font: "Press Start 2P" },
    disney_toon: { backgroundColor: "#1a237e", textColor: "#ffd700", font: "Comic Sans MS" },
    gtav: { backgroundColor: "#1a1a2e", textColor: "#00ff00", font: "Pricedown" },
    comic_book: { backgroundColor: "#ffeb3b", textColor: "#000000", font: "Bangers" },
    anime: { backgroundColor: "#ff69b4", textColor: "#ffffff", font: "Anime Ace" },
    realistic: { backgroundColor: "#2c3e50", textColor: "#ecf0f1", font: "Roboto" },
    retro_game: { backgroundColor: "#000000", textColor: "#00ff00", font: "VT323" },
    watercolor: { backgroundColor: "#f5f5dc", textColor: "#2c3e50", font: "Pacifico" },
    neon_cyber: { backgroundColor: "#0f0f23", textColor: "#00ffff", font: "Orbitron" },
  };
  return styles[style] || styles.dark_minimal;
}

// Map voice personas to ElevenLabs-compatible voice IDs
function getVoiceId(persona: string): string {
  const voices: Record<string, string> = {
    professional_male: "ErXwobaYiN019PkySvjV", // Antoni
    professional_female: "EXAVITQu4vr4xnSDxMaL", // Bella
    energetic_male: "VR6AewLTigWG4xSOukaG", // Arnold
    energetic_female: "jBpfuIE2acCO8z3wKNLl", // Gigi
    calm_narrator: "yoZ06aMxZJJ28mfd3POQ", // Sam
    dramatic: "GBv7mTt0atIp3Br8iCZE", // Thomas
  };
  return voices[persona] || voices.professional_male;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key is configured
    if (!JSON2VIDEO_API_KEY) {
      console.error("JSON2VIDEO_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Video API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid auth token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: VideoRequest = await req.json();
    const { script, title, visual_style, voice_persona, series_id } = body;

    console.log(`Generating video for user ${user.id}: "${title}"`);

    // Get visual style configuration
    const styleConfig = getVisualStyleConfig(visual_style);
    const voiceId = getVoiceId(voice_persona);

    // Split script into sentences for scene generation
    const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Build JSON2Video payload
    const moviePayload = {
      resolution: "custom",
      width: 1080,
      height: 1920,
      quality: "high",
      fps: 30,
      scenes: sentences.map((sentence, index) => ({
        duration: Math.max(3, sentence.trim().split(" ").length * 0.5), // ~0.5 sec per word, min 3 sec
        background: styleConfig.backgroundColor,
        elements: [
          // Text element
          {
            type: "text",
            text: sentence.trim(),
            x: 540,
            y: 960,
            width: 900,
            height: 400,
            align: "center",
            font: styleConfig.font,
            fontSize: 48,
            color: styleConfig.textColor,
            animation: {
              type: index % 2 === 0 ? "fadeIn" : "slideUp",
              duration: 0.5,
            },
          },
          // Voice narration
          {
            type: "voice",
            text: sentence.trim(),
            voice: voiceId,
            provider: "elevenlabs",
          },
        ],
      })),
    };

    console.log("Sending request to JSON2Video API...");

    // Submit video to JSON2Video
    const createResponse = await fetch(`${JSON2VIDEO_BASE_URL}/movies`, {
      method: "POST",
      headers: {
        "x-api-key": JSON2VIDEO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(moviePayload),
    });

    const createData = await createResponse.json();
    console.log("JSON2Video response:", JSON.stringify(createData));

    if (!createData.success) {
      console.error("JSON2Video error:", createData);
      return new Response(
        JSON.stringify({ error: "Failed to initiate video rendering", details: createData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const projectId = createData.project;
    console.log(`Video job created with project ID: ${projectId}`);

    // Create video record in database
    const { data: video, error: insertError } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        title: title,
        status: "generating",
        visual_style: visual_style,
        script_id: null, // Will be linked if from a script
        duration_seconds: sentences.reduce((acc, s) => acc + Math.max(3, s.trim().split(" ").length * 0.5), 0),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting video:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create video record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Video record created: ${video.id}`);

    // Return immediately with project ID for status polling
    return new Response(
      JSON.stringify({
        success: true,
        video_id: video.id,
        project_id: projectId,
        message: "Video generation started",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-video:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
