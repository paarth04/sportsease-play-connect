-- Harden handle_new_user() function with role validation and input sanitization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
  assigned_role app_role;
BEGIN
  -- Validate and restrict role assignment
  requested_role := new.raw_user_meta_data->>'role';
  
  -- Only allow 'user' or 'owner' roles from self-signup
  -- Never allow 'admin' role from self-signup (must be assigned by existing admin)
  IF requested_role = 'owner' THEN
    assigned_role := 'owner'::app_role;
  ELSE
    -- Default to 'user' for any other value or null
    assigned_role := 'user'::app_role;
  END IF;
  
  -- Validate full_name length to prevent excessive data
  IF length(COALESCE(new.raw_user_meta_data->>'full_name', '')) > 255 THEN
    RAISE EXCEPTION 'Full name exceeds maximum length of 255 characters';
  END IF;
  
  -- Insert profile with validated data
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone'
  );
  
  -- Insert validated role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, assigned_role);
  
  RETURN new;
END;
$$;