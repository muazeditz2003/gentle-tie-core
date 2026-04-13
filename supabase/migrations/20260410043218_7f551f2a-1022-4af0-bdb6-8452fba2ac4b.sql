
-- Create blood_requests table
CREATE TABLE public.blood_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  blood_group TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'normal',
  message TEXT,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view open requests
CREATE POLICY "Anyone can view blood requests"
ON public.blood_requests
FOR SELECT
TO authenticated
USING (true);

-- Users can create their own requests
CREATE POLICY "Users can create blood requests"
ON public.blood_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_id);

-- Users can update their own requests
CREATE POLICY "Users can update own blood requests"
ON public.blood_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = requester_id);

-- Users can delete their own requests
CREATE POLICY "Users can delete own blood requests"
ON public.blood_requests
FOR DELETE
TO authenticated
USING (auth.uid() = requester_id);

-- Trigger for updated_at
CREATE TRIGGER update_blood_requests_updated_at
BEFORE UPDATE ON public.blood_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_requests;
