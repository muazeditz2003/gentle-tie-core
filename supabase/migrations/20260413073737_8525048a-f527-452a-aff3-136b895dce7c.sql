DROP POLICY IF EXISTS "Public can view active boosts" ON public.service_boosts;
CREATE POLICY "Public can view active boosts"
ON public.service_boosts
FOR SELECT
TO anon, authenticated
USING (
  status = 'active'
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
);