-- Drop existing restrictive policies on student_progress
DROP POLICY IF EXISTS "Admins can view all progress" ON public.student_progress;
DROP POLICY IF EXISTS "Users can view their own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.student_progress;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Admins can view all progress" 
ON public.student_progress 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own progress" 
ON public.student_progress 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.student_progress 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.student_progress 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);