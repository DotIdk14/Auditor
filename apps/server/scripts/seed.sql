-- Seed script: ejecutar en Supabase SQL Editor o CLI
-- Crea usuarios de prueba, perfiles, áreas, equipos y contactos

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
-- 2. CREAR USUARIOS DE PRUEBA (Ventas Norte)
-- ════════════════════════════════════════════════════════════════
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000001', 'manager.norte@test.com', crypt('Test2026!', gen_salt('bf')), NOW(), '{"full_name":"María García"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manager.norte@test.com');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000002', 'coord.norte@test.com', crypt('Test2026!', gen_salt('bf')), NOW(), '{"full_name":"Carlos López"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'coord.norte@test.com');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000003', 'sup.alpha@test.com', crypt('Test2026!', gen_salt('bf')), NOW(), '{"full_name":"Ana Martínez"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sup.alpha@test.com');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000004', 'agent.norte1@test.com', crypt('Test2026!', gen_salt('bf')), NOW(), '{"full_name":"Pedro Sánchez"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'agent.norte1@test.com');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'b0000000-0000-0000-0000-000000000005', 'agent.norte2@test.com', crypt('Test2026!', gen_salt('bf')), NOW(), '{"full_name":"Laura Díaz"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'agent.norte2@test.com');

-- ════════════════════════════════════════════════════════════════
-- 3. USUARIOS Ventas Sur
-- ════════════════════════════════════════════════════════════════
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'c0000000-0000-0000-0000-000000000001', 'manager.sur@test.com', crypt('Test2026!', gen_salt('bf')), NOW(), '{"full_name":"Roberto Fernández"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manager.sur@test.com');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'c0000000-0000-0000-0000-000000000002', 'sup.beta@test.com', crypt('Test2026!', gen_salt('bf')), NOW(), '{"full_name":"Sofía Ruiz"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sup.beta@test.com');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'c0000000-0000-0000-0000-000000000003', 'agent.sur1@test.com', crypt('Test2026!', gen_salt('bf')), NOW(), '{"full_name":"Diego Torres"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'agent.sur1@test.com');

-- ════════════════════════════════════════════════════════════════
-- 4. USUARIOS Retención
-- ════════════════════════════════════════════════════════════════
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'd0000000-0000-0000-0000-000000000001', 'manager.ret@test.com', crypt('Test2026!', gen_salt('bf')), NOW(), '{"full_name":"Elena Vargas"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manager.ret@test.com');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'd0000000-0000-0000-0000-000000000002', 'agent.ret1@test.com', crypt('Test2026!', gen_salt('bf')), NOW(), '{"full_name":"Jorge Morales"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'agent.ret1@test.com');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'd0000000-0000-0000-0000-000000000003', 'agent.ret2@test.com', crypt('Test2026!', gen_salt('bf')), NOW(), '{"full_name":"Carmen Flores"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'agent.ret2@test.com');

-- ════════════════════════════════════════════════════════════════
-- 5. USUARIOS QA
-- ════════════════════════════════════════════════════════════════
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'e0000000-0000-0000-0000-000000000001', 'qa.norte@test.com', crypt('Test2026!', gen_salt('bf')), NOW(), '{"full_name":"Luis Mendoza"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'qa.norte@test.com');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT 'e0000000-0000-0000-0000-000000000002', 'qa.sur@test.com', crypt('Test2026!', gen_salt('bf')), NOW(), '{"full_name":"Patricia Ortiz"}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'qa.sur@test.com');

-- ════════════════════════════════════════════════════════════════
-- 6. CREAR PERFILES
-- ════════════════════════════════════════════════════════════════
-- Admin
INSERT INTO profiles (id, email, full_name, role, is_active)
SELECT id, email, raw_user_meta_data->>'full_name', 'admin', TRUE
FROM auth.users WHERE email = 'ianidk1@gmail.com'
AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'ianidk1@gmail.com');

-- Ventas Norte perfiles
INSERT INTO profiles (id, email, full_name, role, area_id, team_id, is_active)
SELECT u.id, u.email, u.raw_user_meta_data->>'full_name',
  CASE u.email
    WHEN 'manager.norte@test.com' THEN 'area_manager'
    WHEN 'coord.norte@test.com' THEN 'coordinator'
    WHEN 'sup.alpha@test.com' THEN 'supervisor'
    ELSE 'agent'
  END,
  a.id,
  CASE 
    WHEN u.email IN ('sup.alpha@test.com','agent.norte1@test.com','agent.norte2@test.com') THEN t.id
    ELSE NULL
  END,
  TRUE
FROM auth.users u
CROSS JOIN (SELECT id FROM areas WHERE code = 'VENTAS_NORTE') a
CROSS JOIN (SELECT id FROM teams WHERE code = 'ALPHA') t
WHERE u.email IN ('manager.norte@test.com','coord.norte@test.com','sup.alpha@test.com','agent.norte1@test.com','agent.norte2@test.com')
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.email = u.email);

-- Ventas Sur perfiles
INSERT INTO profiles (id, email, full_name, role, area_id, team_id, is_active)
SELECT u.id, u.email, u.raw_user_meta_data->>'full_name',
  CASE u.email
    WHEN 'manager.sur@test.com' THEN 'area_manager'
    WHEN 'sup.beta@test.com' THEN 'supervisor'
    ELSE 'agent'
  END,
  a.id,
  CASE WHEN u.email IN ('sup.beta@test.com','agent.sur1@test.com') THEN t.id ELSE NULL END,
  TRUE
FROM auth.users u
CROSS JOIN (SELECT id FROM areas WHERE code = 'VENTAS_SUR') a
CROSS JOIN (SELECT id FROM teams WHERE code = 'BETA') t
WHERE u.email IN ('manager.sur@test.com','sup.beta@test.com','agent.sur1@test.com')
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.email = u.email);

-- Retención perfiles
INSERT INTO profiles (id, email, full_name, role, area_id, team_id, is_active)
SELECT u.id, u.email, u.raw_user_meta_data->>'full_name',
  CASE WHEN u.email = 'manager.ret@test.com' THEN 'area_manager' ELSE 'agent' END,
  a.id,
  CASE WHEN u.email IN ('agent.ret1@test.com','agent.ret2@test.com') THEN t.id ELSE NULL END,
  TRUE
FROM auth.users u
CROSS JOIN (SELECT id FROM areas WHERE code = 'RETENCION') a
CROSS JOIN (SELECT id FROM teams WHERE code = 'GAMMA') t
WHERE u.email IN ('manager.ret@test.com','agent.ret1@test.com','agent.ret2@test.com')
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.email = u.email);

-- QA perfiles
INSERT INTO profiles (id, email, full_name, role, area_id, is_active)
SELECT u.id, u.email, u.raw_user_meta_data->>'full_name', 'qa', a.id, TRUE
FROM auth.users u
CROSS JOIN LATERAL (
  SELECT id FROM areas WHERE code = CASE u.email WHEN 'qa.norte@test.com' THEN 'VENTAS_NORTE' WHEN 'qa.sur@test.com' THEN 'VENTAS_SUR' END
) a
WHERE u.email IN ('qa.norte@test.com','qa.sur@test.com')
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.email = u.email);

-- ════════════════════════════════════════════════════════════════
-- 7. ASIGNAR SUPERVISORES Y MANAGERS
-- ════════════════════════════════════════════════════════════════
UPDATE teams t SET supervisor_id = p.id
FROM profiles p WHERE p.email = 'sup.alpha@test.com' AND t.code = 'ALPHA';

UPDATE teams t SET supervisor_id = p.id
FROM profiles p WHERE p.email = 'sup.beta@test.com' AND t.code = 'BETA';

UPDATE areas a SET manager_id = p.id
FROM profiles p WHERE p.email = 'manager.norte@test.com' AND a.code = 'VENTAS_NORTE';

UPDATE areas a SET manager_id = p.id
FROM profiles p WHERE p.email = 'manager.sur@test.com' AND a.code = 'VENTAS_SUR';

UPDATE areas a SET manager_id = p.id
FROM profiles p WHERE p.email = 'manager.ret@test.com' AND a.code = 'RETENCION';

-- ════════════════════════════════════════════════════════════════
-- 8. CONTACTOS DE EJEMPLO
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_pipeline_id UUID;
  v_agents UUID[];
  v_agent_idx INT;
BEGIN
  SELECT id INTO v_pipeline_id FROM pipelines WHERE is_default = TRUE LIMIT 1;
  SELECT ARRAY(SELECT id FROM profiles WHERE role = 'agent' ORDER BY id) INTO v_agents;
  
  IF array_length(v_agents, 1) IS NULL OR v_pipeline_id IS NULL THEN
    RETURN;
  END IF;

  v_agent_idx := 1;
  
  -- Contact 1
  INSERT INTO contacts (full_name, phone, email, company, source, status, assigned_to, area_id, team_id, pipeline_id, stage_id, metadata)
  SELECT 'TechCorp Solutions', '+525511223344', 'contacto@techcorp.com', 'TechCorp Solutions', 'inbound', 'lead',
    v_agents[v_agent_idx], p.area_id, p.team_id, v_pipeline_id, 
    (SELECT id FROM pipeline_stages WHERE name = 'Nuevo' LIMIT 1),
    '{"estimatedValue":50000,"industry":"Technology"}'
  FROM profiles p WHERE p.id = v_agents[v_agent_idx]
  WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'contacto@techcorp.com');
  v_agent_idx := v_agent_idx % array_length(v_agents, 1) + 1;

  INSERT INTO contacts (full_name, phone, email, company, source, status, assigned_to, area_id, team_id, pipeline_id, stage_id, metadata)
  SELECT 'GlobalConnect SA', '+525522334455', 'ventas@globalconnect.com', 'GlobalConnect SA', 'outbound', 'lead',
    v_agents[v_agent_idx], p.area_id, p.team_id, v_pipeline_id,
    (SELECT id FROM pipeline_stages WHERE name = 'Contactado' LIMIT 1),
    '{"estimatedValue":35000,"industry":"Finance"}'
  FROM profiles p WHERE p.id = v_agents[v_agent_idx]
  WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'ventas@globalconnect.com');
  v_agent_idx := v_agent_idx % array_length(v_agents, 1) + 1;

  INSERT INTO contacts (full_name, phone, email, company, source, status, assigned_to, area_id, team_id, pipeline_id, stage_id, metadata)
  SELECT 'InnovaSoft México', '+525533445566', 'info@innovasoft.mx', 'InnovaSoft México', 'web', 'lead',
    v_agents[v_agent_idx], p.area_id, p.team_id, v_pipeline_id,
    (SELECT id FROM pipeline_stages WHERE name = 'Calificado' LIMIT 1),
    '{"estimatedValue":28000,"industry":"Technology"}'
  FROM profiles p WHERE p.id = v_agents[v_agent_idx]
  WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'info@innovasoft.mx');
  v_agent_idx := v_agent_idx % array_length(v_agents, 1) + 1;

  INSERT INTO contacts (full_name, phone, email, company, source, status, assigned_to, area_id, team_id, pipeline_id, stage_id, metadata)
  SELECT 'DataFlow Systems', '+525544556677', 'ventas@dataflow.com', 'DataFlow Systems', 'referral', 'prospect',
    v_agents[v_agent_idx], p.area_id, p.team_id, v_pipeline_id,
    (SELECT id FROM pipeline_stages WHERE name = 'Propuesta' LIMIT 1),
    '{"estimatedValue":75000,"industry":"Manufacturing"}'
  FROM profiles p WHERE p.id = v_agents[v_agent_idx]
  WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'ventas@dataflow.com');
  v_agent_idx := v_agent_idx % array_length(v_agents, 1) + 1;

  INSERT INTO contacts (full_name, phone, email, company, source, status, assigned_to, area_id, team_id, pipeline_id, stage_id, metadata)
  SELECT 'CloudNine Services', '+525555667788', 'hola@cloudnine.com', 'CloudNine Services', 'inbound', 'prospect',
    v_agents[v_agent_idx], p.area_id, p.team_id, v_pipeline_id,
    (SELECT id FROM pipeline_stages WHERE name = 'Negociación' LIMIT 1),
    '{"estimatedValue":120000,"industry":"Technology"}'
  FROM profiles p WHERE p.id = v_agents[v_agent_idx]
  WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'hola@cloudnine.com');
  v_agent_idx := v_agent_idx % array_length(v_agents, 1) + 1;

  INSERT INTO contacts (full_name, phone, email, company, source, status, assigned_to, area_id, team_id, pipeline_id, stage_id, metadata)
  SELECT 'GreenEnergy Corp', '+525566778899', 'info@greenenergy.com', 'GreenEnergy Corp', 'outbound', 'customer',
    v_agents[v_agent_idx], p.area_id, p.team_id, v_pipeline_id,
    (SELECT id FROM pipeline_stages WHERE name = 'Cerrado Ganado' LIMIT 1),
    '{"estimatedValue":90000,"industry":"Energy"}'
  FROM profiles p WHERE p.id = v_agents[v_agent_idx]
  WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'info@greenenergy.com');
  v_agent_idx := v_agent_idx % array_length(v_agents, 1) + 1;

  INSERT INTO contacts (full_name, phone, email, company, source, status, assigned_to, area_id, team_id, pipeline_id, stage_id, metadata)
  SELECT 'BlueOcean Ventures', '+525577889900', 'contacto@blueocean.com', 'BlueOcean Ventures', 'web', 'churned',
    v_agents[v_agent_idx], p.area_id, p.team_id, v_pipeline_id,
    (SELECT id FROM pipeline_stages WHERE name = 'Cerrado Perdido' LIMIT 1),
    '{"estimatedValue":15000,"industry":"Finance"}'
  FROM profiles p WHERE p.id = v_agents[v_agent_idx]
  WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'contacto@blueocean.com');
  v_agent_idx := v_agent_idx % array_length(v_agents, 1) + 1;

  INSERT INTO contacts (full_name, phone, email, company, source, status, assigned_to, area_id, team_id, pipeline_id, stage_id, metadata)
  SELECT 'SmartHome Technologies', '+525588990011', 'ventas@smarthome.com', 'SmartHome Technologies', 'referral', 'lead',
    v_agents[v_agent_idx], p.area_id, p.team_id, v_pipeline_id,
    (SELECT id FROM pipeline_stages WHERE name = 'Nuevo' LIMIT 1),
    '{"estimatedValue":45000,"industry":"Technology"}'
  FROM profiles p WHERE p.id = v_agents[v_agent_idx]
  WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'ventas@smarthome.com');
  v_agent_idx := v_agent_idx % array_length(v_agents, 1) + 1;

  INSERT INTO contacts (full_name, phone, email, company, source, status, assigned_to, area_id, team_id, pipeline_id, stage_id, metadata)
  SELECT 'Pyme Solutions MX', '+525599001122', 'info@pymesolutions.mx', 'Pyme Solutions MX', 'inbound', 'lead',
    v_agents[v_agent_idx], p.area_id, p.team_id, v_pipeline_id,
    (SELECT id FROM pipeline_stages WHERE name = 'Contactado' LIMIT 1),
    '{"estimatedValue":12000,"industry":"Retail"}'
  FROM profiles p WHERE p.id = v_agents[v_agent_idx]
  WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'info@pymesolutions.mx');
  v_agent_idx := v_agent_idx % array_length(v_agents, 1) + 1;

  INSERT INTO contacts (full_name, phone, email, company, source, status, assigned_to, area_id, team_id, pipeline_id, stage_id, metadata)
  SELECT 'NextGen Digital', '+525500112233', 'hola@nextgen.digital', 'NextGen Digital', 'web', 'lead',
    v_agents[v_agent_idx], p.area_id, p.team_id, v_pipeline_id,
    (SELECT id FROM pipeline_stages WHERE name = 'Nuevo' LIMIT 1),
    '{"estimatedValue":65000,"industry":"Technology"}'
  FROM profiles p WHERE p.id = v_agents[v_agent_idx]
  WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'hola@nextgen.digital');
END $$;

-- ════════════════════════════════════════════════════════════════
-- 9. VERIFICAR RESULTADOS
-- ════════════════════════════════════════════════════════════════
SELECT '👤 Usuarios' as item, COUNT(*)::text FROM auth.users WHERE email LIKE '%@test.com' OR email = 'ianidk1@gmail.com'
UNION ALL
SELECT '👤 Perfiles', COUNT(*)::text FROM profiles WHERE email LIKE '%@test.com' OR email = 'ianidk1@gmail.com'
UNION ALL
SELECT '📁 Contactos', COUNT(*)::text FROM contacts
UNION ALL
SELECT '🏢 Áreas', COUNT(*)::text FROM areas
UNION ALL
SELECT '👥 Equipos', COUNT(*)::text FROM teams
UNION ALL
SELECT '📋 Pipeline Stages', COUNT(*)::text FROM pipeline_stages;
