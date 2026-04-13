-- Add relational integrity so PostgREST nested selects work reliably across app queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'workers' AND constraint_name = 'workers_user_id_fkey_profiles'
  ) THEN
    ALTER TABLE public.workers
      ADD CONSTRAINT workers_user_id_fkey_profiles
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'bookings' AND constraint_name = 'bookings_customer_id_fkey_profiles'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_customer_id_fkey_profiles
      FOREIGN KEY (customer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'bookings' AND constraint_name = 'bookings_worker_id_fkey_workers'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_worker_id_fkey_workers
      FOREIGN KEY (worker_id) REFERENCES public.workers(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'reviews' AND constraint_name = 'reviews_customer_id_fkey_profiles'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_customer_id_fkey_profiles
      FOREIGN KEY (customer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'reviews' AND constraint_name = 'reviews_worker_id_fkey_workers'
  ) THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_worker_id_fkey_workers
      FOREIGN KEY (worker_id) REFERENCES public.workers(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'messages' AND constraint_name = 'messages_sender_id_fkey_profiles'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_sender_id_fkey_profiles
      FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'messages' AND constraint_name = 'messages_receiver_id_fkey_profiles'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_receiver_id_fkey_profiles
      FOREIGN KEY (receiver_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;