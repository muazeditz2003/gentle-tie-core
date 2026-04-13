
-- Update handle_new_user function to store city and service_areas
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer')
  );
  IF NEW.raw_user_meta_data->>'role' = 'worker' THEN
    INSERT INTO public.workers (user_id, profession, experience, cnic, city, service_areas)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'profession', ''),
      COALESCE((NEW.raw_user_meta_data->>'experience')::integer, 0),
      COALESCE(NEW.raw_user_meta_data->>'cnic', ''),
      COALESCE(NEW.raw_user_meta_data->>'city', ''),
      CASE WHEN NEW.raw_user_meta_data->>'service_area' IS NOT NULL AND NEW.raw_user_meta_data->>'service_area' != ''
        THEN string_to_array(NEW.raw_user_meta_data->>'service_area', ',')
        ELSE '{}'::text[]
      END
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
