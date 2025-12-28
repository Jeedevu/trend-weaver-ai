import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FAL_KEY = Deno.env.get("FAL_KEY");
const FAL_API_URL = "https://queue.fal.run/fal-ai/sora-2/text-to-video";

interface VideoRequest {
  script: string;
  title: string;
  visual_style: string;
  voice_persona: string;
  series_id?: string;
  user_id?: string; // For automation (when called without user token)
  youtube_title?: string;
  youtube_description?: string;
  aspect_ratio?: string; // "16:9", "9:16", "1:1"
  duration?: number; // 4, 8, 16, 20 seconds
}

// Map visual styles to Sora prompt modifiers
function getVisualStylePrompt(style: string): string {
  const styles: Record<string, string> = {
    dark_minimal: "minimalist dark aesthetic, high contrast, clean modern design",
    minecraft: "Minecraft video game style, blocky voxel graphics, pixelated textures",
    disney_toon: "Disney animation style, colorful cartoon, expressive characters",
    gtav: "Grand Theft Auto V video game style, cinematic urban atmosphere, neon lights",
    comic_book: "comic book art style, bold outlines, halftone dots, vibrant colors",
    anime: "anime style, Japanese animation, vibrant colors, expressive",
    realistic: "photorealistic, cinematic, high quality, detailed",
    retro_game: "retro 8-bit pixel art style, nostalgic video game aesthetic",
    watercolor: "watercolor painting style, soft brushstrokes, artistic",
    neon_cyber: "cyberpunk neon style, futuristic, glowing lights, dark atmosphere",
    autoshorts: "professional video, clean and engaging, modern social media style",
  };
  return styles[style] || styles.realistic;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key is configured
    if (!FAL_KEY) {
      console.error("FAL_KEY is not configured");
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
      console.error("Missing backend env vars");
      return new Response(
        JSON.stringify({ error: "Backend not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body first to check for automation mode
    const body: VideoRequest = await req.json();
    const { 
      script, 
      title, 
      visual_style, 
      voice_persona, 
      series_id, 
      user_id: providedUserId,
      aspect_ratio = "9:16", // Default to vertical for Shorts
      duration = 8 // Default to 8 seconds
    } = body;

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

    // Build the prompt with visual style
    const stylePrompt = getVisualStylePrompt(visual_style);
    const fullPrompt = `${script}. ${stylePrompt}`;

    console.log("Submitting to fal.ai Sora API...");
    console.log("Prompt:", fullPrompt);
    console.log("Aspect ratio:", aspect_ratio);
    console.log("Duration:", duration);

    // Submit video generation request to fal.ai queue
    const falResponse = await fetch(FAL_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        aspect_ratio: aspect_ratio,
        duration: duration,
        resolution: "720p",
      }),
    });

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      console.error("fal.ai API error:", falResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to initiate video rendering", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const falData = await falResponse.json();
    console.log("fal.ai response:", JSON.stringify(falData));

    // fal.ai returns a request_id for queue-based processing
    const requestId = falData.request_id;
    if (!requestId) {
      console.error("No request_id in fal.ai response:", falData);
      return new Response(
        JSON.stringify({ error: "Failed to get request ID from video API" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Video job submitted with request ID: ${requestId}`);

    // Create video record in database using service role client
    const videoRecord: Record<string, unknown> = {
      user_id: userId,
      title: title,
      status: "generating",
      visual_style: visual_style,
      script_id: null,
      duration_seconds: duration,
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

    // Return immediately with request ID for status polling
    return new Response(
      JSON.stringify({
        success: true,
        video_id: video.id,
        project_id: requestId, // Using project_id for compatibility with existing frontend
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
