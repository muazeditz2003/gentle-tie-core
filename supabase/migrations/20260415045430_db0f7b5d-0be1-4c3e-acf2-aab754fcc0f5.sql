ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS main_category text,
ADD COLUMN IF NOT EXISTS sub_category text;

ALTER TABLE public.workers
DROP CONSTRAINT IF EXISTS workers_main_category_allowed;

ALTER TABLE public.workers
ADD CONSTRAINT workers_main_category_allowed
CHECK (
  main_category IS NULL OR main_category IN (
    'Home & Local Services',
    'Automotive & Transport',
    'Shops, Food & Daily Needs',
    'Professional & Business Services',
    'Health, Education & Community',
    'Events & Lifestyle'
  )
);

ALTER TABLE public.workers
DROP CONSTRAINT IF EXISTS workers_sub_category_allowed;

ALTER TABLE public.workers
ADD CONSTRAINT workers_sub_category_allowed
CHECK (
  sub_category IS NULL OR sub_category IN (
    'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Handyman', 'Cleaning', 'Pest Control', 'CCTV', 'Solar', 'Repair',
    'Car/Bike/Truck Repair', 'Tire', 'Oil Change', 'Car Wash', 'Driver', 'Taxi', 'Rental', 'Towing',
    'Grocery', 'Restaurant', 'Cafe', 'Bakery', 'Pharmacy', 'Clothing', 'Electronics', 'Pet Store',
    'Web/App Dev', 'Design', 'SEO', 'Marketing', 'IT Support', 'Accounting', 'Legal', 'Real Estate',
    'Doctor', 'Clinic', 'Dentist', 'Tutor', 'Coaching', 'Blood Donor', 'Ambulance',
    'Event Planner', 'Wedding', 'Photographer', 'Videographer', 'DJ', 'Makeup'
  )
);

ALTER TABLE public.workers
DROP CONSTRAINT IF EXISTS workers_categories_non_blank;

ALTER TABLE public.workers
ADD CONSTRAINT workers_categories_non_blank
CHECK (
  (main_category IS NULL OR length(trim(main_category)) > 0)
  AND (sub_category IS NULL OR length(trim(sub_category)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_workers_main_sub_category
ON public.workers (main_category, sub_category);