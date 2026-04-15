DROP POLICY IF EXISTS "Users can create own worker profile" ON public.workers;

CREATE POLICY "Users can create own worker profile"
ON public.workers
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND main_category IS NOT NULL
  AND sub_category IS NOT NULL
);

DROP POLICY IF EXISTS "Users can update own worker profile" ON public.workers;

CREATE POLICY "Users can update own worker profile"
ON public.workers
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR has_role('admin'::app_role, auth.uid())
)
WITH CHECK (
  (user_id = auth.uid() OR has_role('admin'::app_role, auth.uid()))
  AND main_category IS NOT NULL
  AND sub_category IS NOT NULL
);