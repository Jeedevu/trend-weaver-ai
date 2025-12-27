-- Create enum types
CREATE TYPE public.trend_status AS ENUM ('active', 'declining', 'expired');
CREATE TYPE public.video_status AS ENUM ('queued', 'generating', 'processing', 'ready', 'scheduled', 'publishing', 'published', 'failed');
CREATE TYPE public.subscription_tier AS ENUM ('starter', 'pro', 'agency');

-- Profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'starter',
  videos_created_today INTEGER NOT NULL DEFAULT 0,
  last_video_date DATE,
  youtube_channel_id TEXT,
  youtube_channel_name TEXT,
  youtube_connected BOOLEAN NOT NULL DEFAULT false,
  voice_persona TEXT DEFAULT 'professional_male',
  manual_approval_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trends table for detected YouTube Shorts trends
CREATE TABLE public.trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  velocity_score INTEGER NOT NULL DEFAULT 0,
  engagement_ratio DECIMAL(5,2),
  ai_suitability_score INTEGER NOT NULL DEFAULT 0,
  shelf_life TEXT,
  format_pattern TEXT,
  status trend_status NOT NULL DEFAULT 'active',
  is_hot BOOLEAN NOT NULL DEFAULT false,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Script templates table
CREATE TABLE public.script_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  structure JSONB NOT NULL,
  example TEXT,
  max_words INTEGER NOT NULL DEFAULT 40,
  hook_duration_seconds INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generated scripts table
CREATE TABLE public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trend_id UUID REFERENCES public.trends(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.script_templates(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  hook_text TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generated videos table
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  script_id UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  trend_id UUID REFERENCES public.trends(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  visual_style TEXT NOT NULL DEFAULT 'dark_minimal',
  duration_seconds INTEGER,
  video_url TEXT,
  thumbnail_url TEXT,
  status video_status NOT NULL DEFAULT 'queued',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  youtube_video_id TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Upload queue table for safe automation
CREATE TABLE public.upload_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_post_time TIMESTAMP WITH TIME ZONE,
  randomization_offset_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Action logs for compliance
CREATE TABLE public.action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for trends (public read, no user write)
CREATE POLICY "Anyone can view active trends" ON public.trends FOR SELECT USING (status = 'active');

-- RLS Policies for script_templates (public read)
CREATE POLICY "Anyone can view templates" ON public.script_templates FOR SELECT USING (true);

-- RLS Policies for scripts
CREATE POLICY "Users can view own scripts" ON public.scripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own scripts" ON public.scripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scripts" ON public.scripts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scripts" ON public.scripts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for videos
CREATE POLICY "Users can view own videos" ON public.videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own videos" ON public.videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON public.videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own videos" ON public.videos FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for upload_queue
CREATE POLICY "Users can view own queue" ON public.upload_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own queue items" ON public.upload_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own queue items" ON public.upload_queue FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for action_logs
CREATE POLICY "Users can view own logs" ON public.action_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own logs" ON public.action_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to reset daily video count
CREATE OR REPLACE FUNCTION public.reset_daily_video_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.last_video_date IS DISTINCT FROM CURRENT_DATE THEN
    NEW.videos_created_today := 0;
    NEW.last_video_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to reset daily count
CREATE TRIGGER check_daily_reset
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.reset_daily_video_count();

-- Function to get daily video limit based on tier
CREATE OR REPLACE FUNCTION public.get_daily_limit(tier subscription_tier)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  CASE tier
    WHEN 'starter' THEN RETURN 1;
    WHEN 'pro' THEN RETURN 3;
    WHEN 'agency' THEN RETURN 10;
    ELSE RETURN 1;
  END CASE;
END;
$$;

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default script templates
INSERT INTO public.script_templates (name, description, structure, example, max_words, hook_duration_seconds) VALUES
('hook_fact', 'Hook + Fact', '{"hook": "question", "body": "surprising_answer", "payoff": "implications"}', 'Did you know the ocean produces more oxygen than all rainforests combined? Phytoplankton generate over 50% of Earth''s oxygen. So next time you breathe, thank the ocean.', 40, 2),
('pov_reveal', 'POV Reveal', '{"hook": "pov_statement", "body": "revelation", "payoff": "lasting_implication"}', 'POV: You just learned honey never expires. Archaeologists found 3000-year-old honey in Egyptian tombs. Still perfectly edible. Nature''s only food that lasts forever.', 40, 2),
('comparison', 'This vs That', '{"hook": "comparison_setup", "body": "key_differences", "payoff": "clear_winner"}', 'Stairs vs Escalators. Stairs: unlimited capacity, zero power, instant use. Escalators: break constantly, use power, form lines. Stairs win. Always have.', 40, 2),
('countdown', 'Top 3 Facts', '{"hook": "category_intro", "body": "three_facts", "payoff": "call_to_action"}', 'Three things you didn''t know about your brain. One: It can''t feel pain. Two: It''s 75% water. Three: It uses 20% of your oxygen. Follow for more.', 40, 2);

-- Insert sample trends
INSERT INTO public.trends (name, description, category, velocity_score, ai_suitability_score, shelf_life, format_pattern, is_hot) VALUES
('Fast Facts Dark Mode', 'Quick facts with AI voice over dark minimalist backgrounds. High engagement, easy to produce.', 'Educational', 92, 95, '2-3 weeks', 'dark_background + text_overlay + ai_voice', true),
('POV Shocking Stats', 'First-person view revealing surprising statistics in under 10 seconds with dramatic reveal.', 'Statistics', 87, 88, '1-2 weeks', 'pov_text + dramatic_pause + reveal', true),
('This vs That Comparisons', 'Side-by-side visual comparisons with quick transitions and bold text overlays.', 'Comparison', 78, 82, '3-4 weeks', 'split_screen + bold_text + verdict', false),
('Historical Events Today', 'On this day in history format with archival imagery and dramatic narration.', 'History', 71, 79, 'Evergreen', 'archival_footage + date_overlay + narration', false),
('Mind-Blowing Science', 'Scientific phenomena explained with stunning visuals and dramatic reveals.', 'Science', 84, 91, '2-3 weeks', 'science_visual + explanation + wow_factor', true);