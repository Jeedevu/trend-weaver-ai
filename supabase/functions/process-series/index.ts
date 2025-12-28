import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Series {
  id: string;
  user_id: string;
  name: string;
  topic: string;
  visual_style: string;
  voice_persona: string;
  posting_frequency: string;
  posting_time: string;
  platforms: string[];
  status: string;
  next_video_at: string | null;
  videos_created: number;
  aspect_ratio: string;
  language: string;
  duration_preference: string;
}

// Calculate next video time based on posting frequency
function calculateNextVideoAt(frequency: string, postingTime: string): Date {
  const now = new Date();
  const [hours, minutes] = postingTime.split(':').map(Number);
  
  let nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);
  
  // If the time has passed today, start from tomorrow
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  switch (frequency) {
    case 'daily':
      // Already set to next occurrence
      break;
    case 'twice_daily':
      // Just use the next occurrence
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'three_weekly':
      nextDate.setDate(nextDate.getDate() + 2); // Every ~2.3 days
      break;
    default:
      // Default to daily
      break;
  }
  
  return nextDate;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing active series...');

    // Find active series that need a new video
    const now = new Date().toISOString();
    const { data: seriesList, error: seriesError } = await supabase
      .from('series')
      .select('*')
      .eq('status', 'active')
      .or(`next_video_at.is.null,next_video_at.lte.${now}`);

    if (seriesError) {
      console.error('Error fetching series:', seriesError);
      throw new Error('Failed to fetch series');
    }

    console.log(`Found ${seriesList?.length || 0} series ready for processing`);

    const results = [];

    for (const series of (seriesList as Series[]) || []) {
      try {
        console.log(`Processing series: ${series.name} (${series.id})`);

        // Check user's daily video limit
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_tier, videos_created_today, last_video_date, youtube_connected, youtube_access_token, youtube_refresh_token')
          .eq('id', series.user_id)
          .single();

        if (profileError || !profile) {
          console.error('Error fetching profile for series:', series.id, profileError);
          continue;
        }

        // Get daily limit based on subscription tier
        const { data: limitData } = await supabase.rpc('get_daily_limit', { tier: profile.subscription_tier });
        const dailyLimit = limitData || 1;

        // Check if user has reached their limit
        const today = new Date().toISOString().split('T')[0];
        const videosToday = profile.last_video_date === today ? profile.videos_created_today : 0;
        
        if (videosToday >= dailyLimit) {
          console.log(`User ${series.user_id} has reached daily limit (${videosToday}/${dailyLimit})`);
          continue;
        }

        // Step 1: Generate trending content using AI
        console.log('Generating trending content for series:', series.name);
        
        const trendingResponse = await fetch(`${supabaseUrl}/functions/v1/generate-trending-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            topic: series.topic,
            visual_style: series.visual_style,
            voice_persona: series.voice_persona,
            language: series.language || 'en',
            platforms: series.platforms || ['youtube'],
          }),
        });

        if (!trendingResponse.ok) {
          const errorText = await trendingResponse.text();
          console.error('Failed to generate trending content:', errorText);
          continue;
        }

        const trendingData = await trendingResponse.json();
        const content = trendingData.content;

        console.log('Generated content:', { title: content.title, hook: content.hook });

        // Step 2: Generate video using the script
        console.log('Triggering video generation...');
        
        const videoResponse = await fetch(`${supabaseUrl}/functions/v1/generate-video`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            title: content.title,
            script: content.script,
            visual_style: series.visual_style,
            voice_persona: series.voice_persona,
            user_id: series.user_id,
            series_id: series.id,
            youtube_title: content.title,
            youtube_description: `${content.description}\n\n${content.hashtags?.join(' ') || ''}`,
          }),
        });

        if (!videoResponse.ok) {
          const errorText = await videoResponse.text();
          console.error('Failed to generate video:', errorText);
          continue;
        }

        const videoData = await videoResponse.json();
        console.log('Video generation started:', videoData);

        // Step 3: Update series with next video time and increment counter
        const nextVideoAt = calculateNextVideoAt(series.posting_frequency, series.posting_time);
        
        const { error: updateError } = await supabase
          .from('series')
          .update({
            next_video_at: nextVideoAt.toISOString(),
            last_video_generated_at: new Date().toISOString(),
            videos_created: (series.videos_created || 0) + 1,
          })
          .eq('id', series.id);

        if (updateError) {
          console.error('Error updating series:', updateError);
        }

        // Update user's daily video count
        await supabase
          .from('profiles')
          .update({
            videos_created_today: videosToday + 1,
            last_video_date: today,
          })
          .eq('id', series.user_id);

        results.push({
          series_id: series.id,
          series_name: series.name,
          video_id: videoData.video_id,
          project_id: videoData.project_id,
          title: content.title,
          next_video_at: nextVideoAt.toISOString(),
        });

        console.log(`Successfully processed series: ${series.name}`);

      } catch (seriesError) {
        console.error(`Error processing series ${series.id}:`, seriesError);
        results.push({
          series_id: series.id,
          series_name: series.name,
          error: seriesError instanceof Error ? seriesError.message : 'Unknown error',
        });
      }
    }

    console.log('Processing complete. Results:', results);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-series:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
