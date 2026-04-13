DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('customer', 'worker', 'admin');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
$$;

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role('admin', auth.uid()))
WITH CHECK (public.has_role('admin', auth.uid()));

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role('admin', auth.uid()));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'boost_type') THEN
    CREATE TYPE public.boost_type AS ENUM ('featured_listing', 'priority_ranking', 'urgent_boost');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'boost_status') THEN
    CREATE TYPE public.boost_status AS ENUM ('pending', 'active', 'expired', 'rejected');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_event_type') THEN
    CREATE TYPE public.analytics_event_type AS ENUM ('profile_view', 'contact_click', 'message_received', 'conversion');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.featured_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL,
  owner_user_id UUID,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 100,
  rotation_seed INTEGER NOT NULL DEFAULT floor(random() * 1000000)::INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.featured_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active featured services" ON public.featured_services;
CREATE POLICY "Anyone can view active featured services"
ON public.featured_services FOR SELECT TO anon, authenticated
USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
DROP POLICY IF EXISTS "Admins can manage featured services" ON public.featured_services;
CREATE POLICY "Admins can manage featured services"
ON public.featured_services FOR ALL TO authenticated
USING (public.has_role('admin', auth.uid()))
WITH CHECK (public.has_role('admin', auth.uid()));
CREATE INDEX IF NOT EXISTS idx_featured_services_active ON public.featured_services (is_active, starts_at, ends_at, priority DESC);
CREATE INDEX IF NOT EXISTS idx_featured_services_service_id ON public.featured_services (service_id);
DROP TRIGGER IF EXISTS trg_featured_services_updated_at ON public.featured_services;
CREATE TRIGGER trg_featured_services_updated_at BEFORE UPDATE ON public.featured_services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.native_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_type TEXT NOT NULL DEFAULT 'in_feed',
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  cta_label TEXT NOT NULL DEFAULT 'Learn more',
  cta_url TEXT NOT NULL,
  placement TEXT NOT NULL DEFAULT 'discover_feed',
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 100,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.native_ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active native ads" ON public.native_ads;
CREATE POLICY "Anyone can view active native ads"
ON public.native_ads FOR SELECT TO anon, authenticated
USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
DROP POLICY IF EXISTS "Admins can manage native ads" ON public.native_ads;
CREATE POLICY "Admins can manage native ads"
ON public.native_ads FOR ALL TO authenticated
USING (public.has_role('admin', auth.uid()))
WITH CHECK (public.has_role('admin', auth.uid()));
CREATE INDEX IF NOT EXISTS idx_native_ads_lookup ON public.native_ads (placement, is_active, starts_at, ends_at, priority DESC);
DROP TRIGGER IF EXISTS trg_native_ads_updated_at ON public.native_ads;
CREATE TRIGGER trg_native_ads_updated_at BEFORE UPDATE ON public.native_ads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.ad_placement_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  frequency_min INTEGER NOT NULL DEFAULT 4,
  frequency_max INTEGER NOT NULL DEFAULT 6,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_placement_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view enabled placement settings" ON public.ad_placement_settings;
CREATE POLICY "Anyone can view enabled placement settings"
ON public.ad_placement_settings FOR SELECT TO anon, authenticated
USING (enabled = true OR public.has_role('admin', auth.uid()));
DROP POLICY IF EXISTS "Admins can manage placement settings" ON public.ad_placement_settings;
CREATE POLICY "Admins can manage placement settings"
ON public.ad_placement_settings FOR ALL TO authenticated
USING (public.has_role('admin', auth.uid()))
WITH CHECK (public.has_role('admin', auth.uid()));
DROP TRIGGER IF EXISTS trg_ad_placement_settings_updated_at ON public.ad_placement_settings;
CREATE TRIGGER trg_ad_placement_settings_updated_at BEFORE UPDATE ON public.ad_placement_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.ad_placement_settings (placement_key, enabled, frequency_min, frequency_max)
VALUES ('home_banner', true, 1, 1), ('home_feed', true, 4, 6), ('discover_feed', true, 4, 6), ('category_feed', true, 4, 6), ('search_results', true, 4, 6)
ON CONFLICT (placement_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.service_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL,
  owner_user_id UUID NOT NULL,
  boost_type public.boost_type NOT NULL,
  status public.boost_status NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  price_cents INTEGER,
  visibility_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_boosts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners and admins can view boosts" ON public.service_boosts;
CREATE POLICY "Owners and admins can view boosts"
ON public.service_boosts FOR SELECT TO authenticated
USING (owner_user_id = auth.uid() OR public.has_role('admin', auth.uid()));
DROP POLICY IF EXISTS "Owners and admins can create boosts" ON public.service_boosts;
CREATE POLICY "Owners and admins can create boosts"
ON public.service_boosts FOR INSERT TO authenticated
WITH CHECK (owner_user_id = auth.uid() OR public.has_role('admin', auth.uid()));
DROP POLICY IF EXISTS "Owners and admins can update boosts" ON public.service_boosts;
CREATE POLICY "Owners and admins can update boosts"
ON public.service_boosts FOR UPDATE TO authenticated
USING (owner_user_id = auth.uid() OR public.has_role('admin', auth.uid()))
WITH CHECK (owner_user_id = auth.uid() OR public.has_role('admin', auth.uid()));
DROP POLICY IF EXISTS "Admins can delete boosts" ON public.service_boosts;
CREATE POLICY "Admins can delete boosts"
ON public.service_boosts FOR DELETE TO authenticated
USING (public.has_role('admin', auth.uid()));
CREATE INDEX IF NOT EXISTS idx_service_boosts_owner_status ON public.service_boosts (owner_user_id, status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_service_boosts_service_id ON public.service_boosts (service_id);
DROP TRIGGER IF EXISTS trg_service_boosts_updated_at ON public.service_boosts;
CREATE TRIGGER trg_service_boosts_updated_at BEFORE UPDATE ON public.service_boosts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.service_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL,
  owner_user_id UUID,
  event_type public.analytics_event_type NOT NULL,
  source TEXT NOT NULL DEFAULT 'app',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create analytics events" ON public.service_analytics_events;
CREATE POLICY "Anyone can create analytics events"
ON public.service_analytics_events FOR INSERT TO anon, authenticated
WITH CHECK (true);
DROP POLICY IF EXISTS "Owners and admins can view analytics events" ON public.service_analytics_events;
CREATE POLICY "Owners and admins can view analytics events"
ON public.service_analytics_events FOR SELECT TO authenticated
USING (owner_user_id = auth.uid() OR public.has_role('admin', auth.uid()));
CREATE INDEX IF NOT EXISTS idx_service_analytics_events_service ON public.service_analytics_events (service_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_analytics_events_owner ON public.service_analytics_events (owner_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_service_analytics_summary(_service_id UUID, _owner_user_id UUID, _days INTEGER DEFAULT 30)
RETURNS TABLE (
  profile_views BIGINT,
  contact_clicks BIGINT,
  messages_received BIGINT,
  conversions BIGINT,
  conversion_rate NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH events AS (
    SELECT event_type
    FROM public.service_analytics_events
    WHERE service_id = _service_id
      AND owner_user_id = _owner_user_id
      AND created_at >= now() - make_interval(days => GREATEST(_days, 1))
  )
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'profile_view'),
    COUNT(*) FILTER (WHERE event_type = 'contact_click'),
    COUNT(*) FILTER (WHERE event_type = 'message_received'),
    COUNT(*) FILTER (WHERE event_type = 'conversion'),
    CASE
      WHEN COUNT(*) FILTER (WHERE event_type = 'contact_click') = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE event_type = 'conversion')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE event_type = 'contact_click')::NUMERIC, 0)) * 100, 2)
    END
  FROM events;
$$;