
-- Create bookings table for appointment system
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  service_description TEXT NOT NULL DEFAULT '',
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Customers can create bookings
CREATE POLICY "Customers can create bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

-- Users can view their own bookings (as customer or worker)
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = customer_id OR 
    auth.uid() = (SELECT user_id FROM public.workers WHERE id = worker_id)
  );

-- Workers can update booking status
CREATE POLICY "Workers can update booking status"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM public.workers WHERE id = worker_id)
  );

-- Customers can update their own bookings
CREATE POLICY "Customers can update own bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id);

-- Customers can delete their own pending bookings
CREATE POLICY "Customers can delete pending bookings"
  ON public.bookings FOR DELETE
  TO authenticated
  USING (auth.uid() = customer_id AND status = 'pending');

-- Enable realtime for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Add updated_at trigger for bookings
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
