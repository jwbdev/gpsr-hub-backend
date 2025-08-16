-- First, let's see what supplier IDs are in products but not in suppliers
SELECT DISTINCT gpsr_submitted_by_supplier_user 
FROM public.products 
WHERE gpsr_submitted_by_supplier_user IS NOT NULL 
AND gpsr_submitted_by_supplier_user NOT IN (SELECT id FROM public.suppliers);

-- Clear invalid supplier references
UPDATE public.products 
SET gpsr_submitted_by_supplier_user = NULL 
WHERE gpsr_submitted_by_supplier_user IS NOT NULL 
AND gpsr_submitted_by_supplier_user NOT IN (SELECT id FROM public.suppliers);

-- Drop the existing foreign key constraint
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_gpsr_submitted_by_supplier_user_fkey;

-- Add the correct foreign key constraint from products to suppliers
ALTER TABLE public.products 
ADD CONSTRAINT products_gpsr_submitted_by_supplier_user_fkey 
FOREIGN KEY (gpsr_submitted_by_supplier_user) 
REFERENCES public.suppliers(id) 
ON DELETE SET NULL;