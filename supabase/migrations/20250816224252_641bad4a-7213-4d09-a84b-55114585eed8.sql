-- Add foreign key constraints to link tables with profiles

-- Add foreign key constraint from categories.user_id to profiles.user_id
ALTER TABLE public.categories 
ADD CONSTRAINT categories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key constraint from products.user_id to profiles.user_id  
ALTER TABLE public.products 
ADD CONSTRAINT products_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;