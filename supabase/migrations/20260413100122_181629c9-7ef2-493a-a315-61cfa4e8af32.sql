DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workers_user_id_fkey_profiles'
      AND conrelid = 'public.workers'::regclass
  ) THEN
    ALTER TABLE public.workers
    ADD CONSTRAINT workers_user_id_fkey_profiles
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(user_id)
    ON DELETE CASCADE;
  END IF;
END $$;