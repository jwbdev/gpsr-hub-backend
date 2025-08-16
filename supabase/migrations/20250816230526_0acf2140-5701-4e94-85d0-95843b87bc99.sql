-- Update RLS policy on profiles to allow viewing basic info of all users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy that allows authenticated users to view basic profile info of all users
CREATE POLICY "Authenticated users can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Keep the existing policies for insert and update unchanged
-- Users can still only insert/update their own profiles