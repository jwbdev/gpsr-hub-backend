-- Revert the broad profile access policy
DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;

-- Restore the original restrictive policy
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a security definer function to get owner names for products/categories
CREATE OR REPLACE FUNCTION public.get_owner_name(owner_user_id uuid)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    TRIM(CONCAT(first_name, ' ', last_name)),
    'Unknown User'
  )
  FROM public.profiles 
  WHERE user_id = owner_user_id;
$$;

-- Create views that include owner names without exposing full profile data
CREATE OR REPLACE VIEW public.categories_with_owner AS
SELECT 
  c.*,
  public.get_owner_name(c.user_id) as owner_name
FROM public.categories c;

CREATE OR REPLACE VIEW public.products_with_owner AS
SELECT 
  p.*,
  public.get_owner_name(p.user_id) as owner_name
FROM public.products p;

-- Grant access to the views for authenticated users
GRANT SELECT ON public.categories_with_owner TO authenticated;
GRANT SELECT ON public.products_with_owner TO authenticated;

-- Enable RLS on the views
ALTER VIEW public.categories_with_owner SET (security_barrier = true);
ALTER VIEW public.products_with_owner SET (security_barrier = true);