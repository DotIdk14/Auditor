-- ════════════════════════════════════════════════════════════════════
-- Script: setup-supervisor.sql
-- Propósito: Crear/actualizar el perfil de supervisor para ianidk1@gmail.com
-- y asegurar que el trigger de auto-creación de perfiles esté activo.
-- Ejecutar en: Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- ════════════════════════════════════════════════════════════════════

-- 1. Verificar si el usuario existe en auth.users
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'ianidk1@gmail.com';

  IF uid IS NULL THEN
    RAISE NOTICE '❌ El usuario ianidk1@gmail.com NO existe en auth.users.';
    RAISE NOTICE '   Ve a Authentication > Add User en Supabase:';
    RAISE NOTICE '   Email: ianidk1@gmail.com, Password: THe100cia, Auto-confirm: YES';
    RAISE NOTICE '   Luego ejecuta este script de nuevo.';
  ELSE
    RAISE NOTICE '✅ Usuario encontrado en auth.users: %', uid;

    -- 2. Insertar o actualizar el perfil
    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (uid, 'ianidk1@gmail.com', 'Ian Admin', 'supervisor', TRUE)
    ON CONFLICT (id) DO UPDATE SET
      role = 'supervisor',
      is_active = TRUE,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      updated_at = NOW();

    RAISE NOTICE '✅ Perfil creado/actualizado en public.profiles con rol supervisor';
  END IF;
END $$;

-- 3. Verificar el resultado final
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_active,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.email = 'ianidk1@gmail.com';

-- 4. Verificar que el trigger on_auth_user_created existe
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
