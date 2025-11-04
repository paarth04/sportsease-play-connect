-- Add explicit anonymous denial policy to profiles table for defense-in-depth security
CREATE POLICY "Deny all anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- This creates an explicit security barrier preventing any anonymous access to PII
-- Complements existing authenticated policies without modifying them