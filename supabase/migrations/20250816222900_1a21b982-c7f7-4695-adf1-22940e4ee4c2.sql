-- Update RLS policies to make categories and products visible to all users

-- Drop existing restrictive SELECT policies
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;

-- Create new public view policies for categories
CREATE POLICY "All users can view all categories" 
ON public.categories 
FOR SELECT 
USING (true);

-- Create new public view policies for products
CREATE POLICY "All users can view all products" 
ON public.products 
FOR SELECT 
USING (true);