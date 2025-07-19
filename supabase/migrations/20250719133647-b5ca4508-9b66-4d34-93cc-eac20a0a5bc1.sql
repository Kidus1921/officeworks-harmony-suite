-- Temporarily allow anon users to manage roles during setup
DROP POLICY "Only admins can manage roles" ON public.roles;

CREATE POLICY "Allow role management during setup" 
ON public.roles 
FOR ALL 
USING (true);