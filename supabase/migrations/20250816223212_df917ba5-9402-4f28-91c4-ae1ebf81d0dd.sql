-- Fix security issue: Restrict products and categories to authenticated users only

-- Drop existing public policies that allow unauthenticated access
DROP POLICY IF EXISTS "All users can view all categories" ON public.categories;
DROP POLICY IF EXISTS "All users can view all products" ON public.products;

-- Create new policies for authenticated users only
CREATE POLICY "Authenticated users can view all categories" 
ON public.categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all products" 
ON public.products 
FOR SELECT 
USING (auth.uid() IS NOT NULL);