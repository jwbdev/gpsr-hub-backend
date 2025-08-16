-- Create table for access requests
CREATE TABLE public.access_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_user_id uuid NOT NULL,
  owner_user_id uuid NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('category', 'product')),
  resource_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(requester_user_id, resource_type, resource_id)
);

-- Create table for granted access
CREATE TABLE public.shared_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  owner_user_id uuid NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('category', 'product')),
  resource_id uuid NOT NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, resource_type, resource_id)
);

-- Enable RLS on both tables
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;

-- RLS policies for access_requests
CREATE POLICY "Users can view requests they sent or received" 
ON public.access_requests 
FOR SELECT 
USING (auth.uid() = requester_user_id OR auth.uid() = owner_user_id);

CREATE POLICY "Users can create access requests" 
ON public.access_requests 
FOR INSERT 
WITH CHECK (auth.uid() = requester_user_id);

CREATE POLICY "Owners can update request status" 
ON public.access_requests 
FOR UPDATE 
USING (auth.uid() = owner_user_id);

-- RLS policies for shared_access
CREATE POLICY "Users can view shared access they have or granted" 
ON public.shared_access 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = owner_user_id);

CREATE POLICY "Owners can grant access" 
ON public.shared_access 
FOR INSERT 
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can revoke access" 
ON public.shared_access 
FOR DELETE 
USING (auth.uid() = owner_user_id);

-- Add updated_at trigger
CREATE TRIGGER update_access_requests_updated_at
BEFORE UPDATE ON public.access_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has access to resource
CREATE OR REPLACE FUNCTION public.user_has_access(user_id_param uuid, resource_type_param text, resource_id_param uuid)
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_access 
    WHERE user_id = user_id_param 
    AND resource_type = resource_type_param 
    AND resource_id = resource_id_param
  );
$$;