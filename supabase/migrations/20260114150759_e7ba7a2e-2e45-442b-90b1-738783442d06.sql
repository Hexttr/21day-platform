-- Fix policies to be PERMISSIVE for practical_materials
DROP POLICY IF EXISTS "Anyone authenticated can read published materials" ON public.practical_materials;
DROP POLICY IF EXISTS "Admins can do everything with practical materials" ON public.practical_materials;

CREATE POLICY "Anyone authenticated can read published materials" 
ON public.practical_materials 
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_published = true);

CREATE POLICY "Admins can do everything with practical materials" 
ON public.practical_materials 
AS PERMISSIVE
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Also fix lesson_content policies to be PERMISSIVE
DROP POLICY IF EXISTS "Anyone authenticated can read published lessons" ON public.lesson_content;
DROP POLICY IF EXISTS "Admins can do everything with lessons" ON public.lesson_content;

CREATE POLICY "Anyone authenticated can read published lessons" 
ON public.lesson_content 
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (is_published = true);

CREATE POLICY "Admins can do everything with lessons" 
ON public.lesson_content 
AS PERMISSIVE
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));