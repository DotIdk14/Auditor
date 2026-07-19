-- ════════════════════════════════════════════════════════════════════
-- Migration 011: Set ijarquiher@utel.edu.mx as admin
-- ════════════════════════════════════════════════════════════════════
-- Ejecutar en Supabase SQL Editor o vía CLI.
-- Funciona tanto si el usuario ya existe (auth + profiles) como si no.
-- ════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'ijarquiher@utel.edu.mx';
  v_full_name TEXT := 'Iván Jarquín';
BEGIN
  -- 1. Buscar si el usuario ya existe en auth.users (por ejemplo, ya hizo login con Google)
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  -- 2. Si no existe, crearlo con un UUID
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
      v_user_id,
      v_email,
      '',  -- sin password (login vía Google OAuth)
      NOW(),
      jsonb_build_object('full_name', v_full_name),
      NOW(),
      NOW()
    );
    RAISE NOTICE '[MIGRATION] Auth user creado: % (%)', v_email, v_user_id;
  ELSE
    RAISE NOTICE '[MIGRATION] Auth user encontrado: % (%)', v_email, v_user_id;
  END IF;

  -- 3. Upsert en profiles como admin
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (v_user_id, v_email, v_full_name, 'admin', TRUE)
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_active = TRUE,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

  RAISE NOTICE '[MIGRATION] Perfil actualizado/creado: % → admin', v_email;
END $$;

-- Verificar
SELECT email, role, is_active FROM public.profiles WHERE email = 'ijarquiher@utel.edu.mx';
