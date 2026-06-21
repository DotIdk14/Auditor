-- ════════════════════════════════════════════════════════════════════
-- Migration 007: Normalize user roles & auto-create profiles
-- ════════════════════════════════════════════════════════════════════
-- 1. Fix any existing NULL roles in profiles
-- 2. Add trigger to auto-create profile on user sign-up
-- 3. Add admin function to manually assign/update roles
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- 1. NORMALIZE EXISTING PROFILES
-- ════════════════════════════════════════════════════════════════════
-- Set any NULL or invalid roles to default 'agent'
UPDATE profiles
SET role = 'agent'
WHERE role IS NULL
   OR role NOT IN ('admin', 'area_manager', 'coordinator', 'supervisor', 'agent', 'qa');

-- Ensure all new profiles get the correct default
ALTER TABLE profiles
  ALTER COLUMN role SET DEFAULT 'agent',
  ALTER COLUMN role SET NOT NULL;

-- Log how many rows were fixed
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RAISE NOTICE '[MIGRATION] Perfiles normalizados: % filas actualizadas', fixed_count;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- 2. AUTO-CREATE PROFILE ON USER SIGNUP
-- ════════════════════════════════════════════════════════════════════
-- This trigger runs whenever a new user is created in auth.users
-- and creates a corresponding row in public.profiles. Users start
-- with 'agent' role until an admin/coordinator upgrades them.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'agent',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if re-running migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════
-- 3. ADMIN FUNCTION: UPDATE USER ROLE
-- ════════════════════════════════════════════════════════════════════
-- Safe function that admins/coordinators can call to change a user's
-- role. Only users with admin or area_manager role can execute this.

CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Get the caller's role
  SELECT p.role INTO caller_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- Only admin and area_manager can assign roles
  IF caller_role NOT IN ('admin', 'area_manager') THEN
    RAISE EXCEPTION 'Permiso denegado: solo administradores pueden asignar roles';
  END IF;

  -- Validate new_role
  IF new_role NOT IN ('admin', 'area_manager', 'coordinator', 'supervisor', 'agent', 'qa') THEN
    RAISE EXCEPTION 'Rol inválido: %', new_role;
  END IF;

  -- Update the user's role
  UPDATE public.profiles
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════════════════
-- 4. SYNC MISSING PROFILES
-- ════════════════════════════════════════════════════════════════════
-- Create profiles for any auth.users who don't have one yet (backfill)
INSERT INTO public.profiles (id, email, full_name, role, is_active)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  'agent',
  TRUE
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════
-- 5. ROLE VALIDATION: Ensure profiles table is consistent
-- ════════════════════════════════════════════════════════════════════
-- Add constraint if not already present (double-check migration 003)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_role_check'
      AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('admin', 'area_manager', 'coordinator', 'supervisor', 'agent', 'qa'));
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- 6. AUDIT LOG: Report current role distribution
-- ════════════════════════════════════════════════════════════════════
SELECT
  role,
  COUNT(*) AS count
FROM public.profiles
GROUP BY role
ORDER BY count DESC;
