-- Drop old restrictive policy for practical_materials
DROP POLICY IF EXISTS "Anyone authenticated can read published materials" ON public.practical_materials;

-- Create new policy that allows public access to published materials (like lesson_content)
CREATE POLICY "Anyone can read published materials" 
ON public.practical_materials 
FOR SELECT 
TO public
USING (is_published = true);