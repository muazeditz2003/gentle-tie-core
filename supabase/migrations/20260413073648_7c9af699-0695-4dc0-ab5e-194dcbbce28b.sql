DROP POLICY IF EXISTS "Anyone can create analytics events" ON public.service_analytics_events;
CREATE POLICY "Anyone can create analytics events"
ON public.service_analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  service_id IS NOT NULL
  AND event_type IN ('profile_view', 'contact_click', 'message_received', 'conversion')
  AND length(coalesce(source, '')) > 0
);