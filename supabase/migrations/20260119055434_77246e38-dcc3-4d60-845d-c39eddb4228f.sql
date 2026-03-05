-- Drop the restrictive policy
DROP POLICY IF EXISTS "Anyone authenticated can read published lessons" ON public.lesson_content;

-- Create a permissive policy that allows anyone to read published lessons
CREATE POLICY "Anyone can read published lessons" 
ON public.lesson_content 
FOR SELECT 
USING (is_published = true);