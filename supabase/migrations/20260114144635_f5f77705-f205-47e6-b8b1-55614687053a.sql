-- Drop the existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Recreate as PERMISSIVE policies (so either one can grant access)
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));