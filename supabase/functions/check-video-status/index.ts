import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JSON2VIDEO_API_KEY = Deno.env.get("JSON2VIDEO_API_KEY");
const JSON2VIDEO_BASE_URL = "https://api.json2video.com/v2";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!JSON2VIDEO_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Video API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid auth token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { project_id, video_id } = await req.json();

    if (!project_id || !video_id) {
      return new Response(
        JSON.stringify({ error: "project_id and video_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checking status for project: ${project_id}, video: ${video_id}`);

    // Check status with JSON2Video
    const statusResponse = await fetch(
      `${JSON2VIDEO_BASE_URL}/movies?project=${project_id}`,
      {
        method: "GET",
        headers: {
          "x-api-key": JSON2VIDEO_API_KEY,
        },
      }
    );

    const statusData = await statusResponse.json();
    console.log("Status response:", JSON.stringify(statusData));

    if (!statusData.success) {
      return new Response(
        JSON.stringify({ error: "Failed to check video status", details: statusData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const movie = statusData.movie;
    let videoStatus: "generating" | "ready" | "failed" = "generating";
    let videoUrl: string | null = null;
    let thumbnailUrl: string | null = null;
    let duration: number | null = null;

    switch (movie.status) {
      case "done":
        videoStatus = "ready";
        videoUrl = movie.url;
        duration = Math.round(movie.duration);
        // Generate thumbnail from first frame (could be enhanced later)
        thumbnailUrl = movie.url?.replace(".mp4", "_thumb.jpg") || null;
        break;
      case "error":
        videoStatus = "failed";
        console.error("Video rendering failed:", movie.message);
        break;
      case "pending":
      case "running":
        videoStatus = "generating";
        break;
    }

    // Update video record in database
    const updateData: Record<string, any> = {
      status: videoStatus,
    };

    if (videoUrl) {
      updateData.video_url = videoUrl;
    }
    if (thumbnailUrl) {
      updateData.thumbnail_url = thumbnailUrl;
    }
    if (duration) {
      updateData.duration_seconds = duration;
    }
    if (videoStatus === "failed") {
      updateData.error_message = movie.message || "Video rendering failed";
    }

    const { error: updateError } = await supabase
      .from("videos")
      .update(updateData)
      .eq("id", video_id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating video:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: videoStatus,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration: duration,
        message: movie.message || null,
        remaining_quota: statusData.remaining_quota,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-video-status:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
