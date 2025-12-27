-- Fix search_path for get_daily_limit function
CREATE OR REPLACE FUNCTION public.get_daily_limit(tier subscription_tier)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = public
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