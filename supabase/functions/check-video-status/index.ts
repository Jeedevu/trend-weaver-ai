import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FAL_KEY = Deno.env.get("FAL_KEY");
const FAL_STATUS_URL = "https://queue.fal.run/fal-ai/sora-2/text-to-video/requests";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!FAL_KEY) {
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
        JSON.stringify({ error: "project_id (fal request_id) and video_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checking status for fal.ai request: ${project_id}, video: ${video_id}`);

    // Check status with fal.ai
    const statusResponse = await fetch(`${FAL_STATUS_URL}/${project_id}/status`, {
      method: "GET",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error("fal.ai status error:", statusResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to check video status", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const statusData = await statusResponse.json();
    console.log("Status response:", JSON.stringify(statusData));

    let videoStatus: "generating" | "ready" | "failed" = "generating";
    let videoUrl: string | null = null;
    let thumbnailUrl: string | null = null;
    let duration: number | null = null;

    // fal.ai status can be: IN_QUEUE, IN_PROGRESS, COMPLETED, FAILED
    switch (statusData.status) {
      case "COMPLETED":
        // Need to fetch the result separately
        const resultResponse = await fetch(`${FAL_STATUS_URL}/${project_id}`, {
          method: "GET",
          headers: {
            "Authorization": `Key ${FAL_KEY}`,
            "Content-Type": "application/json",
          },
        });

        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          console.log("Result data:", JSON.stringify(resultData));
          
          videoStatus = "ready";
          videoUrl = resultData.video?.url || null;
          thumbnailUrl = resultData.thumbnail?.url || null;
          duration = resultData.video?.duration || null;
        } else {
          videoStatus = "failed";
          console.error("Failed to fetch result:", await resultResponse.text());
        }
        break;
      case "FAILED":
        videoStatus = "failed";
        console.error("Video rendering failed:", statusData.error);
        break;
      case "IN_QUEUE":
      case "IN_PROGRESS":
        videoStatus = "generating";
        break;
      default:
        console.log("Unknown status:", statusData.status);
        videoStatus = "generating";
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
      updateData.duration_seconds = Math.round(duration);
    }
    if (videoStatus === "failed") {
      updateData.error_message = statusData.error || "Video rendering failed";
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
        message: statusData.error || null,
        queue_position: statusData.queue_position || null,
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
