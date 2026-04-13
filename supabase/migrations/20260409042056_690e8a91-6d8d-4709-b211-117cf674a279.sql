
-- Add blood donation columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_blood_donor boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS donor_status text NOT NULL DEFAULT 'inactive';

-- Enable realtime for profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
