-- ════════════════════════════════════════════════════════════════════
-- Script: cleanup-test-users.sql
-- Propósito: Eliminar todos los usuarios de prueba de la base de datos
-- Mantiene solo: ianidk1@gmail.com
-- Ejecutar en: Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════════

-- 1. IDs de usuarios de prueba a eliminar (todos @test.com y @visor.com)
-- Se excluye ianidk1@gmail.com

-- 2. Limpiar referencias en areas y teams (manager_id, supervisor_id)
UPDATE areas SET manager_id = NULL
WHERE manager_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@test.com' OR email LIKE '%@visor.com'
);

UPDATE teams SET supervisor_id = NULL
WHERE supervisor_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@test.com' OR email LIKE '%@visor.com'
);

-- 3. Eliminar tareas asignadas a usuarios de prueba
DELETE FROM tasks
WHERE assigned_to IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@test.com' OR email LIKE '%@visor.com'
);

-- 4. Eliminar contactos asignados a usuarios de prueba
DELETE FROM contacts
WHERE assigned_to IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@test.com' OR email LIKE '%@visor.com'
);

-- 5. Eliminar auditorías vinculadas a usuarios de prueba
DELETE FROM auditorias
WHERE contact_id IN (
  SELECT id FROM contacts
  WHERE assigned_to IN (
    SELECT id FROM auth.users 
    WHERE email LIKE '%@test.com' OR email LIKE '%@visor.com'
  )
);

-- 6. Eliminar perfiles de usuarios de prueba
DELETE FROM profiles
WHERE email LIKE '%@test.com' OR email LIKE '%@visor.com';

-- 7. Eliminar usuarios de auth.users
DELETE FROM auth.users
WHERE email LIKE '%@test.com' OR email LIKE '%@visor.com';

-- 8. Verificar resultados
SELECT 'Usuarios restantes' as item, COUNT(*)::text FROM auth.users
UNION ALL
SELECT 'Perfiles restantes', COUNT(*)::text FROM profiles
UNION ALL
SELECT 'Admin existe', CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'ianidk1@gmail.com') THEN 'SI' ELSE 'NO' END;
