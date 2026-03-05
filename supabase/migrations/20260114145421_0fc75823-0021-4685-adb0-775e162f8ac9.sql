-- Fix student_progress RLS policies to be PERMISSIVE
DROP POLICY IF EXISTS "Users can view their own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.student_progress;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can view their own progress" 
ON public.student_progress 
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" 
ON public.student_progress 
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));