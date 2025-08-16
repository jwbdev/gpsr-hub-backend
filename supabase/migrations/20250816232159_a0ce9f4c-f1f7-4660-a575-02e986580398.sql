-- Update RLS policies to be more restrictive at database level
-- Categories: Users can only view their own categories by default
DROP POLICY IF EXISTS "Authenticated users can view all categories" ON public.categories;

CREATE POLICY "Users can view their own categories" 
ON public.categories 
FOR SELECT 
USING (auth.uid() = user_id);

-- Products: Users can only view their own products by default  
DROP POLICY IF EXISTS "Authenticated users can view all products" ON public.products;

CREATE POLICY "Users can view their own products" 
ON public.products 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a secure function to get basic category info (name + owner) for sharing
CREATE OR REPLACE FUNCTION public.get_shared_categories()
RETURNS TABLE (
  id uuid,
  name text,
  parent_id uuid,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  owner_name text
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.name,
    c.parent_id,
    c.user_id,
    c.created_at,
    c.updated_at,
    public.get_owner_name(c.user_id) as owner_name
  FROM public.categories c
  ORDER BY c.name;
$$;

-- Create a secure function to get basic product info (name + owner) for sharing
CREATE OR REPLACE FUNCTION public.get_shared_products(category_filter uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  category_id uuid,
  gpsr_identification_details text,
  created_at timestamptz,
  updated_at timestamptz,
  owner_name text
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.category_id,
    p.gpsr_identification_details,
    p.created_at,
    p.updated_at,
    public.get_owner_name(p.user_id) as owner_name
  FROM public.products p
  WHERE (category_filter IS NULL OR p.category_id = category_filter)
  ORDER BY p.created_at DESC;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_shared_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_products(uuid) TO authenticated;