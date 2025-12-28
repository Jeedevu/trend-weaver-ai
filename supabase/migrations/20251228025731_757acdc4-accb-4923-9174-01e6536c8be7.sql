-- Create series status enum
CREATE TYPE public.series_status AS ENUM ('active', 'paused', 'completed');

-- Create series table for automated video series
CREATE TABLE public.series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  prompt_template TEXT,
  visual_style TEXT NOT NULL DEFAULT 'dark_minimal',
  voice_persona TEXT NOT NULL DEFAULT 'professional_male',
  posting_frequency TEXT NOT NULL DEFAULT 'daily',
  posting_time TIME NOT NULL DEFAULT '12:00:00',
  platforms JSONB NOT NULL DEFAULT '["youtube"]'::jsonb,
  status series_status NOT NULL DEFAULT 'active',
  videos_created INTEGER NOT NULL DEFAULT 0,
  next_video_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own series"
ON public.series
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own series"
ON public.series
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own series"
ON public.series
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own series"
ON public.series
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_series_updated_at
BEFORE UPDATE ON public.series
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();