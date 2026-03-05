-- Fix the SELECT policy to properly target authenticated users
DROP POLICY IF EXISTS "Anyone authenticated can read published materials" ON public.practical_materials;

CREATE POLICY "Anyone authenticated can read published materials" 
ON public.practical_materials 
FOR SELECT
TO authenticated
USING (is_published = true);

-- Also fix admin policy to properly target authenticated users
DROP POLICY IF EXISTS "Admins can do everything with practical materials" ON public.practical_materials;

CREATE POLICY "Admins can do everything with practical materials" 
ON public.practical_materials 
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));