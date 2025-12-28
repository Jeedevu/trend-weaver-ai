import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_CLIENT_ID = Deno.env.get('YOUTUBE_CLIENT_ID');
const YOUTUBE_CLIENT_SECRET = Deno.env.get('YOUTUBE_CLIENT_SECRET');

interface Video {
  id: string;
  user_id: string;
  title: string;
  video_url: string;
  series_id: string | null;
  status: string;
}

// Refresh YouTube access token
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: YOUTUBE_CLIENT_ID!,
        client_secret: YOUTUBE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh token:', await response.text());
      return null;
    }

    const data = await response.json();
    return { access_token: data.access_token, expires_in: data.expires_in };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

// Get valid access token (refresh if needed)
async function getValidAccessToken(
  supabase: any,
  userId: string,
  accessToken: string | null,
  refreshToken: string | null,
  expiresAt: string | null
): Promise<string | null> {
  if (!accessToken || !refreshToken) {
    console.log('No tokens available for user:', userId);
    return null;
  }

  // Check if token is expired (with 5 min buffer)
  const now = new Date();
  const expiry = expiresAt ? new Date(expiresAt) : new Date(0);
  const isExpired = expiry.getTime() - 5 * 60 * 1000 < now.getTime();

  if (!isExpired) {
    return accessToken;
  }

  console.log('Token expired, refreshing for user:', userId);
  
  const newTokens = await refreshAccessToken(refreshToken);
  if (!newTokens) {
    return null;
  }

  // Update tokens in database
  const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
  
  await supabase
    .from('profiles')
    .update({
      youtube_access_token: newTokens.access_token,
      youtube_token_expires_at: newExpiresAt,
    })
    .eq('id', userId);

  return newTokens.access_token;
}

// Generate trending metadata using AI
async function generateTrendingMetadata(
  supabaseUrl: string,
  serviceKey: string,
  video: Video,
  seriesTopic: string
): Promise<{ title: string; description: string } | null> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-trending-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        topic: seriesTopic || video.title,
        visual_style: 'dark_minimal',
        voice_persona: 'professional_male',
      }),
    });

    if (!response.ok) {
      console.error('Failed to generate metadata');
      return null;
    }

    const data = await response.json();
    return {
      title: data.content?.title || video.title,
      description: `${data.content?.description || ''}\n\n${data.content?.hashtags?.join(' ') || ''}`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for videos ready to publish...');

    // Find ready videos that haven't been published yet (linked to active series)
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select(`
        id,
        user_id,
        title,
        video_url,
        series_id,
        status,
        series!inner (
          id,
          topic,
          platforms,
          status
        )
      `)
      .eq('status', 'ready')
      .is('youtube_video_id', null)
      .not('series_id', 'is', null);

    if (videosError) {
      console.error('Error fetching videos:', videosError);
      throw new Error('Failed to fetch videos');
    }

    console.log(`Found ${videos?.length || 0} videos ready for auto-publish`);

    const results = [];

    for (const video of videos || []) {
      try {
        console.log(`Processing video: ${video.title} (${video.id})`);

        // Get user's YouTube tokens
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('youtube_connected, youtube_access_token, youtube_refresh_token, youtube_token_expires_at')
          .eq('id', video.user_id)
          .single();

        if (profileError || !profile) {
          console.error('Error fetching profile:', profileError);
          continue;
        }

        if (!profile.youtube_connected) {
          console.log('YouTube not connected for user:', video.user_id);
          continue;
        }

        // Get valid access token
        const accessToken = await getValidAccessToken(
          supabase,
          video.user_id,
          profile.youtube_access_token,
          profile.youtube_refresh_token,
          profile.youtube_token_expires_at
        );

        if (!accessToken) {
          console.log('Could not get valid access token for user:', video.user_id);
          
          // Mark video as failed
          await supabase
            .from('videos')
            .update({ 
              status: 'failed',
              error_message: 'YouTube token expired. Please reconnect your channel.'
            })
            .eq('id', video.id);
          
          continue;
        }

        // Generate trending metadata
        const seriesTopic = (video as any).series?.topic || video.title;
        const metadata = await generateTrendingMetadata(supabaseUrl, supabaseServiceKey, video, seriesTopic);

        const uploadTitle = metadata?.title || video.title;
        const uploadDescription = metadata?.description || video.title;

        // Download video file
        console.log('Downloading video from:', video.video_url);
        const videoResponse = await fetch(video.video_url);
        if (!videoResponse.ok) {
          throw new Error('Failed to download video file');
        }
        const videoBlob = await videoResponse.blob();

        // Update status to publishing
        await supabase
          .from('videos')
          .update({ status: 'publishing' })
          .eq('id', video.id);

        // Initiate resumable upload to YouTube
        console.log('Starting YouTube upload...');
        
        const uploadMetadata = {
          snippet: {
            title: uploadTitle.substring(0, 100),
            description: uploadDescription.substring(0, 5000),
            tags: ['shorts', 'viral', 'trending'],
            categoryId: '22', // People & Blogs
          },
          status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false,
          },
        };

        // Get upload URL
        const initiateResponse = await fetch(
          'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'X-Upload-Content-Length': String(videoBlob.size),
              'X-Upload-Content-Type': 'video/mp4',
            },
            body: JSON.stringify(uploadMetadata),
          }
        );

        if (!initiateResponse.ok) {
          const errorText = await initiateResponse.text();
          console.error('Failed to initiate upload:', errorText);
          
          await supabase
            .from('videos')
            .update({ 
              status: 'failed',
              error_message: 'Failed to initiate YouTube upload'
            })
            .eq('id', video.id);
          
          continue;
        }

        const uploadUrl = initiateResponse.headers.get('Location');
        if (!uploadUrl) {
          throw new Error('No upload URL received');
        }

        // Upload the video
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Length': String(videoBlob.size),
          },
          body: videoBlob,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Failed to upload video:', errorText);
          
          await supabase
            .from('videos')
            .update({ 
              status: 'failed',
              error_message: 'Failed to upload video to YouTube'
            })
            .eq('id', video.id);
          
          continue;
        }

        const uploadResult = await uploadResponse.json();
        const youtubeVideoId = uploadResult.id;

        console.log('Video uploaded successfully:', youtubeVideoId);

        // Update video record
        await supabase
          .from('videos')
          .update({
            status: 'published',
            youtube_video_id: youtubeVideoId,
            published_at: new Date().toISOString(),
          })
          .eq('id', video.id);

        results.push({
          video_id: video.id,
          youtube_video_id: youtubeVideoId,
          title: uploadTitle,
          success: true,
        });

        console.log(`Successfully published video: ${video.title}`);

      } catch (videoError) {
        console.error(`Error processing video ${video.id}:`, videoError);
        
        await supabase
          .from('videos')
          .update({ 
            status: 'failed',
            error_message: videoError instanceof Error ? videoError.message : 'Unknown error'
          })
          .eq('id', video.id);
        
        results.push({
          video_id: video.id,
          error: videoError instanceof Error ? videoError.message : 'Unknown error',
          success: false,
        });
      }
    }

    console.log('Auto-publish complete. Results:', results);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in auto-publish:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
