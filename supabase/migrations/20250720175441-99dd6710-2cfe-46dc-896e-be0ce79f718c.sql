-- Remove the user_id foreign key constraint and column from users table
-- This allows the users table to be standalone for user management

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_id_fkey;
ALTER TABLE public.users DROP COLUMN IF EXISTS user_id;