-- Add YouTube token storage to profiles (secure server-side storage)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS youtube_access_token text,
ADD COLUMN IF NOT EXISTS youtube_refresh_token text,
ADD COLUMN IF NOT EXISTS youtube_token_expires_at timestamptz;

-- Add series tracking and configuration columns
ALTER TABLE public.series 
ADD COLUMN IF NOT EXISTS last_video_generated_at timestamptz,
ADD COLUMN IF NOT EXISTS aspect_ratio text DEFAULT '9:16',
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS duration_preference text DEFAULT '60-90',
ADD COLUMN IF NOT EXISTS series_id uuid;

-- Add series_id to videos table to link generated videos to their series
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES public.series(id) ON DELETE SET NULL;

-- Create index for efficient series processing queries
CREATE INDEX IF NOT EXISTS idx_series_next_video_at ON public.series(next_video_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_videos_series_id ON public.videos(series_id);

-- Update RLS policies to allow service role access for automation
-- (Service role bypasses RLS, so no changes needed)