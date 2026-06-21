-- ════════════════════════════════════════════════════════════════════
-- Script: setup-supervisor.sql
-- Propósito: Crear/actualizar el perfil de supervisor para ianidk1@gmail.com
-- Ejecutar en: Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- ════════════════════════════════════════════════════════════════════

-- 1. Verificar si el usuario existe en auth.users
-- Si no existe, debes crearlo primero desde Supabase Authentication > Add User
SELECT id, email, created_at FROM auth.users WHERE email = 'ianidk1@gmail.com';

-- 2. Verificar si ya tiene perfil
SELECT * FROM public.profiles WHERE email = 'ianidk1@gmail.com';

-- 3. Si existe en auth.users pero no en profiles, usar el trigger on_auth_user_created
--    o insertar manualmente (reemplazar 'USER_UUID' con el id de auth.users):
-- INSERT INTO public.profiles (id, email, full_name, role, is_active)
-- VALUES ('USER_UUID', 'ianidk1@gmail.com', 'Ian Admin', 'supervisor', TRUE)
-- ON CONFLICT (id) DO UPDATE SET role = 'supervisor', is_active = TRUE;

-- 4. Actualizar rol a supervisor (si ya existe el profile)
UPDATE public.profiles
SET role = 'supervisor', is_active = TRUE
WHERE email = 'ianidk1@gmail.com';

-- 5. Verificar resultado
SELECT id, email, full_name, role, is_active FROM public.profiles WHERE email = 'ianidk1@gmail.com';

-- ════════════════════════════════════════════════════════════════════
-- Para crear el usuario desde la API de Supabase (alternativa):
-- ════════════════════════════════════════════════════════════════════
-- Ve a Authentication > Add User en el dashboard de Supabase:
--   Email: ianidk1@gmail.com
--   Password: THe100cia
--   Auto-confirm: YES
-- Luego ejecuta las queries 3 y 4 de arriba.

-- ════════════════════════════════════════════════════════════════════
-- Para crear areas/teams (opcional, necesario para RLS):
-- ════════════════════════════════════════════════════════════════════
-- INSERT INTO public.areas (id, name, code, description)
-- VALUES ('area-001', 'Ventas General', 'VENTAS_GEN', 'Área de ventas principal');
--
-- INSERT INTO public.teams (id, area_id, name, code)
-- VALUES ('team-001', 'area-001', 'Equipo Alpha', 'ALPHA');
--
-- UPDATE public.profiles SET area_id = 'area-001', team_id = 'team-001'
-- WHERE email = 'ianidk1@gmail.com';
