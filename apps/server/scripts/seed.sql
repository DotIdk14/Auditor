-- Seed script: ejecutar en Supabase SQL Editor o CLI
-- Crea solo el usuario administrador principal

-- ════════════════════════════════════════════════════════════════
-- 1. CREAR USUARIO ADMIN
-- ════════════════════════════════════════════════════════════════
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'a0000000-0000-0000-0000-000000000001', 'ianidk1@gmail.com', 
  crypt('Admin2026!', gen_salt('bf')), NOW(), 
  '{"full_name":"Ian Administrador"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ianidk1@gmail.com');

INSERT INTO profiles (id, email, full_name, role, is_active)
SELECT 'a0000000-0000-0000-0000-000000000001', 'ianidk1@gmail.com', 'Ian Administrador', 'admin', TRUE
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'ianidk1@gmail.com');

-- ════════════════════════════════════════════════════════════════
-- 2. VERIFICAR RESULTADOS
-- ════════════════════════════════════════════════════════════════
SELECT '👤 Usuario admin' as item, email, role FROM profiles WHERE email = 'ianidk1@gmail.com';
