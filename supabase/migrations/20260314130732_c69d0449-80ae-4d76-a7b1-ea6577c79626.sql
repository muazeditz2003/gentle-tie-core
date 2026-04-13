-- Remove duplicate foreign keys that can cause ambiguous nested-select relationships
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_worker_id_fkey_workers;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_worker_id_fkey_workers;