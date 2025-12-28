import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const YOUTUBE_CLIENT_ID = Deno.env.get("YOUTUBE_CLIENT_ID");
const YOUTUBE_CLIENT_SECRET = Deno.env.get("YOUTUBE_CLIENT_SECRET");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse body once at the start
    const body = await req.json().catch(() => ({}));
    const action = body.action || new URL(req.url).searchParams.get("action");
    const authHeader = req.headers.get("Authorization");
    
    console.log("YouTube auth action:", action);
    
    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create auth client for user verification
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    if (action === "get-auth-url") {
      // Generate OAuth URL for YouTube
      if (!YOUTUBE_CLIENT_ID) {
        console.error("YOUTUBE_CLIENT_ID not configured");
        return new Response(
          JSON.stringify({ error: "YouTube OAuth not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify user
      const token = authHeader?.replace("Bearer ", "") || "";
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);
      if (authError || !user) {
        console.error("Auth error:", authError);
        return new Response(
          JSON.stringify({ error: "Not authenticated" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const redirectUri = body.redirect_uri || `${supabaseUrl}/functions/v1/youtube-callback`;

      const scopes = [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
      ].join(" ");

      // Encode state with user ID for callback
      const state = btoa(JSON.stringify({ user_id: user.id }));

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", YOUTUBE_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", state);

      console.log("Generated YouTube auth URL for user:", user.id);

      return new Response(
        JSON.stringify({ auth_url: authUrl.toString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "exchange-code") {
      const { code, redirect_uri } = body;

      if (!code) {
        return new Response(
          JSON.stringify({ error: "Authorization code required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify user
      const token = authHeader?.replace("Bearer ", "") || "";
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Not authenticated" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Exchanging code for tokens, user:", user.id);

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: YOUTUBE_CLIENT_ID!,
          client_secret: YOUTUBE_CLIENT_SECRET!,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirect_uri || `${supabaseUrl}/functions/v1/youtube-callback`,
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log("Token response status:", tokenResponse.status);

      if (!tokenResponse.ok) {
        console.error("Token exchange error:", tokenData);
        return new Response(
          JSON.stringify({ error: "Failed to exchange code", details: tokenData }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get channel info
      const channelResponse = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );
      const channelData = await channelResponse.json();
      console.log("Channel data:", JSON.stringify(channelData));

      const channel = channelData.items?.[0];
      const channelId = channel?.id || null;
      const channelName = channel?.snippet?.title || null;

      // Store tokens and channel info in profile using service role
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Calculate token expiration time
      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          youtube_connected: true,
          youtube_channel_id: channelId,
          youtube_channel_name: channelName,
          youtube_access_token: tokenData.access_token,
          youtube_refresh_token: tokenData.refresh_token,
          youtube_token_expires_at: expiresAt,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to save YouTube connection" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("YouTube connected successfully for user:", user.id);

      return new Response(
        JSON.stringify({
          success: true,
          channel_id: channelId,
          channel_name: channelName,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disconnect") {
      // Verify user
      const token = authHeader?.replace("Bearer ", "") || "";
      const { data: { user }, error: authError } = await authClient.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Not authenticated" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update profile - clear all YouTube data including tokens
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          youtube_connected: false,
          youtube_channel_id: null,
          youtube_channel_name: null,
          youtube_access_token: null,
          youtube_refresh_token: null,
          youtube_token_expires_at: null,
        })
        .eq("id", user.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to disconnect YouTube" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Invalid action received:", action);
    return new Response(
      JSON.stringify({ error: "Invalid action", received: action }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("YouTube auth error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
