-- Add foreign key constraint from products to suppliers
ALTER TABLE public.products 
ADD CONSTRAINT products_gpsr_submitted_by_supplier_user_fkey 
FOREIGN KEY (gpsr_submitted_by_supplier_user) 
REFERENCES public.suppliers(id) 
ON DELETE SET NULL;