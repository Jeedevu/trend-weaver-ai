import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const YOUTUBE_CLIENT_ID = Deno.env.get("YOUTUBE_CLIENT_ID");
const YOUTUBE_CLIENT_SECRET = Deno.env.get("YOUTUBE_CLIENT_SECRET");

interface UploadRequest {
  video_id: string;
  access_token: string;
  refresh_token?: string;
  title: string;
  description?: string;
  tags?: string[];
  privacy_status?: "public" | "unlisted" | "private";
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: YOUTUBE_CLIENT_ID!,
        client_secret: YOUTUBE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();
    if (response.ok && data.access_token) {
      return data.access_token;
    }
    console.error("Token refresh failed:", data);
    return null;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: UploadRequest = await req.json();
    const { video_id, access_token, refresh_token, title, description, tags, privacy_status } = body;

    console.log(`Starting YouTube upload for video ${video_id}, user ${user.id}`);

    // Get video details from database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", video_id)
      .eq("user_id", user.id)
      .single();

    if (videoError || !video) {
      console.error("Video not found:", videoError);
      return new Response(
        JSON.stringify({ error: "Video not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!video.video_url) {
      return new Response(
        JSON.stringify({ error: "Video file not ready" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update video status to publishing
    await supabase
      .from("videos")
      .update({ status: "publishing" })
      .eq("id", video_id);

    // Download the video file
    console.log("Downloading video from:", video.video_url);
    const videoResponse = await fetch(video.video_url);
    if (!videoResponse.ok) {
      throw new Error("Failed to download video file");
    }
    const videoBlob = await videoResponse.blob();
    console.log("Video downloaded, size:", videoBlob.size);

    // Try to upload with current access token
    let currentToken = access_token;

    // Step 1: Initialize resumable upload
    const metadata = {
      snippet: {
        title: title || video.title,
        description: description || `Generated with AI • ${video.visual_style} style`,
        tags: tags || ["shorts", "ai", "generated"],
        categoryId: "22", // People & Blogs
      },
      status: {
        privacyStatus: privacy_status || "public",
        selfDeclaredMadeForKids: false,
        madeForKids: false,
      },
    };

    console.log("Initializing YouTube upload with metadata:", JSON.stringify(metadata));

    let initResponse = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": videoBlob.size.toString(),
          "X-Upload-Content-Type": "video/mp4",
        },
        body: JSON.stringify(metadata),
      }
    );

    // If 401, try refreshing token
    if (initResponse.status === 401 && refresh_token) {
      console.log("Token expired, refreshing...");
      const newToken = await refreshAccessToken(refresh_token);
      if (newToken) {
        currentToken = newToken;
        initResponse = await fetch(
          "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${currentToken}`,
              "Content-Type": "application/json; charset=UTF-8",
              "X-Upload-Content-Length": videoBlob.size.toString(),
              "X-Upload-Content-Type": "video/mp4",
            },
            body: JSON.stringify(metadata),
          }
        );
      }
    }

    if (!initResponse.ok) {
      const errorData = await initResponse.text();
      console.error("Upload init failed:", initResponse.status, errorData);
      
      await supabase
        .from("videos")
        .update({ 
          status: "failed", 
          error_message: `YouTube upload failed: ${initResponse.status}` 
        })
        .eq("id", video_id);

      return new Response(
        JSON.stringify({ error: "Failed to initialize YouTube upload", details: errorData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uploadUrl = initResponse.headers.get("Location");
    if (!uploadUrl) {
      throw new Error("No upload URL returned from YouTube");
    }

    console.log("Got upload URL, uploading video...");

    // Step 2: Upload the video
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": videoBlob.size.toString(),
      },
      body: videoBlob,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      console.error("Video upload failed:", uploadResponse.status, errorData);
      
      await supabase
        .from("videos")
        .update({ 
          status: "failed", 
          error_message: `Video upload failed: ${uploadResponse.status}` 
        })
        .eq("id", video_id);

      return new Response(
        JSON.stringify({ error: "Failed to upload video to YouTube" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uploadData = await uploadResponse.json();
    const youtubeVideoId = uploadData.id;
    console.log("Video uploaded successfully! YouTube ID:", youtubeVideoId);

    // Update video status to published
    await supabase
      .from("videos")
      .update({ 
        status: "published",
        youtube_video_id: youtubeVideoId,
        published_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", video_id);

    return new Response(
      JSON.stringify({
        success: true,
        youtube_video_id: youtubeVideoId,
        youtube_url: `https://youtube.com/shorts/${youtubeVideoId}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("YouTube upload error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
