-- Remove redundant role column from profiles table
-- This eliminates a dangerous secondary authorization path
-- All role data is properly stored in the user_roles table with security definer functions

ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;