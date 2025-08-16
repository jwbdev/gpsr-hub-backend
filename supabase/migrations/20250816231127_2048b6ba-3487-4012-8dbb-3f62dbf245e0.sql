-- Drop the problematic views
DROP VIEW IF EXISTS public.categories_with_owner;
DROP VIEW IF EXISTS public.products_with_owner;

-- Fix the function to have proper search path
DROP FUNCTION IF EXISTS public.get_owner_name(uuid);

CREATE OR REPLACE FUNCTION public.get_owner_name(owner_user_id uuid)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    TRIM(CONCAT(first_name, ' ', last_name)),
    'Unknown User'
  )
  FROM public.profiles 
  WHERE user_id = owner_user_id;
$$;