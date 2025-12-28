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
  user_id?: string; // For automation (when called without user token)
  youtube_title?: string;
  youtube_description?: string;
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

// Map voice personas to Azure voice IDs (free with JSON2Video)
function getAzureVoice(persona: string): string {
  const voices: Record<string, string> = {
    professional_male: "en-US-GuyNeural",
    professional_female: "en-US-JennyNeural",
    energetic_male: "en-US-DavisNeural",
    energetic_female: "en-US-AriaNeural",
    calm_narrator: "en-US-ChristopherNeural",
    dramatic: "en-GB-RyanNeural",
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
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize backend clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("Missing backend env vars", {
        hasUrl: Boolean(supabaseUrl),
        hasServiceKey: Boolean(supabaseServiceKey),
        hasAnonKey: Boolean(supabaseAnonKey),
      });
      return new Response(
        JSON.stringify({ error: "Backend not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body first to check for automation mode
    const body: VideoRequest = await req.json();
    const { script, title, visual_style, voice_persona, series_id, user_id: providedUserId, youtube_title, youtube_description } = body;

    let userId: string;

    // If user_id is provided (automation mode with service key), use it directly
    if (providedUserId && authHeader.includes(supabaseServiceKey!.substring(0, 20))) {
      userId = providedUserId;
      console.log(`Automation mode: using provided user_id ${userId}`);
    } else {
      // Verify user token ourselves (since platform JWT verification is disabled)
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const {
        data: { user },
        error: authError,
      } = await authClient.auth.getUser();

      if (authError || !user) {
        console.error("Auth error:", authError?.message || "No user found");
        return new Response(
          JSON.stringify({ error: "Invalid auth token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = user.id;
    }

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Generating video for user ${userId}: "${title}"`);

    // Get visual style configuration
    const styleConfig = getVisualStyleConfig(visual_style);
    const voiceName = getAzureVoice(voice_persona);

    // Split script into sentences for scene generation
    const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Build JSON2Video payload using correct API schema
    const moviePayload = {
      resolution: "instagram-story", // 1080x1920 for vertical video (Shorts)
      quality: "high",
      scenes: sentences.map((sentence, index) => ({
        "background-color": styleConfig.backgroundColor,
        duration: -1, // Auto-calculate based on voice duration
        elements: [
          // Text element with settings object
          {
            type: "text",
            text: sentence.trim(),
            duration: -2, // Match scene duration
            settings: {
              "font-family": styleConfig.font,
              "font-size": "48px",
              "font-color": styleConfig.textColor,
              "text-align": "center",
              "vertical-align": "middle",
              padding: "40px",
            },
          },
          // Voice narration using Azure (free)
          {
            type: "voice",
            text: sentence.trim(),
            voice: voiceName,
            model: "azure",
          },
        ],
      })),
    };

    console.log("Sending request to JSON2Video API...");
    console.log("Payload:", JSON.stringify(moviePayload, null, 2));

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

    // Estimate duration (~3 sec per sentence minimum)
    const estimatedDuration = sentences.reduce((acc, s) => 
      acc + Math.max(3, s.trim().split(" ").length * 0.4), 0
    );

    // Create video record in database using service role client
    const videoRecord: Record<string, unknown> = {
      user_id: userId,
      title: title,
      status: "generating",
      visual_style: visual_style,
      script_id: null,
      duration_seconds: Math.round(estimatedDuration),
    };

    // Add series_id if provided (for automation)
    if (series_id) {
      videoRecord.series_id = series_id;
    }

    const { data: video, error: insertError } = await supabase
      .from("videos")
      .insert(videoRecord)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting video:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create video record", details: insertError.message }),
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
