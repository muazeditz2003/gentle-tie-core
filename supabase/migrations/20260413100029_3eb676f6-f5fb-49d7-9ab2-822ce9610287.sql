CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  avatar_url text,
  city text,
  blood_group text,
  is_blood_donor boolean NOT NULL DEFAULT false,
  donor_status text NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  profession text NOT NULL,
  experience integer NOT NULL DEFAULT 0,
  description text,
  available boolean NOT NULL DEFAULT true,
  verified boolean NOT NULL DEFAULT false,
  service_areas text[] NOT NULL DEFAULT '{}',
  city text,
  latitude double precision,
  longitude double precision,
  cnic text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Workers are viewable when available" ON public.workers;
CREATE POLICY "Workers are viewable when available"
ON public.workers
FOR SELECT
TO anon, authenticated
USING (available = true OR user_id = auth.uid() OR public.has_role('admin'::public.app_role, auth.uid()));

DROP POLICY IF EXISTS "Users can create own worker profile" ON public.workers;
CREATE POLICY "Users can create own worker profile"
ON public.workers
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own worker profile" ON public.workers;
CREATE POLICY "Users can update own worker profile"
ON public.workers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.has_role('admin'::public.app_role, auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.has_role('admin'::public.app_role, auth.uid()));

DROP POLICY IF EXISTS "Users can create own basic role" ON public.user_roles;
CREATE POLICY "Users can create own basic role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND role IN ('customer'::public.app_role, 'worker'::public.app_role));

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workers_updated_at ON public.workers;
CREATE TRIGGER update_workers_updated_at
BEFORE UPDATE ON public.workers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();