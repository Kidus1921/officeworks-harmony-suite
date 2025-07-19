-- Temporarily allow anon users to manage users during setup
DROP POLICY "Only admins and HR can manage users" ON public.users;

CREATE POLICY "Allow user management during setup" 
ON public.users 
FOR ALL 
USING (true);