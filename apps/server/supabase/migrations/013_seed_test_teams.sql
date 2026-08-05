-- ============================================
-- Migration 013: Seed 2 test teams (coordinators + supervisors + agents)
-- Run AFTER migration 012 (needs teams.coordinator_id/supervisor_id).
-- Idempotent: upserts by fixed UUIDs / email.
-- Run with:
--   npx @insforge/cli db query "$(cat apps/server/supabase/migrations/013_seed_test_teams.sql)"
--
-- Test users (log in with just the email, no Google needed):
--   Admin:      ijarquiher@utel.edu.mx (exists)
--   Coord1:     coord1.test@utel.edu.mx   → Equipo Alpha (Prueba Norte)
--   Coord2:     coord2.test@utel.edu.mx   → Equipo Beta  (Prueba Sur)
--   Sup1:       sup1.test@utel.edu.mx     → Equipo Alpha
--   Sup2:       sup2.test@utel.edu.mx     → Equipo Beta
--   Agentes:    ag1a/ag1b.test@utel.edu.mx (Alpha), ag2a/ag2b.test@utel.edu.mx (Beta)
-- ============================================

-- ── 1. AREAS (fixed UUIDs) ─────────────────────────────
INSERT INTO public.areas (id, name, code, description, is_active, created_at, updated_at) VALUES
  ('00000000-0000-4000-8000-000000000001', 'Prueba Norte', 'TEST_NORTE', 'Área de prueba 1 (Norte)', TRUE, now(), now()),
  ('00000000-0000-4000-8000-000000000002', 'Prueba Sur',   'TEST_SUR',   'Área de prueba 2 (Sur)',   TRUE, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  is_active = TRUE;

-- ── 2. USERS (best-effort auth.users + profiles) ────────
-- Profiles first (profiles.id is the user id used by the app).
INSERT INTO public.profiles (id, email, full_name, role, area_id, team_id, is_active, created_at, updated_at) VALUES
  ('00000000-0000-4000-8000-000000000021', 'coord1.test@utel.edu.mx', 'Coordinadora 1 (Norte)', 'coordinator', '00000000-0000-4000-8000-000000000001', NULL, TRUE, now(), now()),
  ('00000000-0000-4000-8000-000000000022', 'coord2.test@utel.edu.mx', 'Coordinador 2 (Sur)',    'coordinator', '00000000-0000-4000-8000-000000000002', NULL, TRUE, now(), now()),
  ('00000000-0000-4000-8000-000000000031', 'sup1.test@utel.edu.mx',   'Supervisor 1 (Norte)',  'supervisor',  '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', TRUE, now(), now()),
  ('00000000-0000-4000-8000-000000000032', 'sup2.test@utel.edu.mx',   'Supervisor 2 (Sur)',    'supervisor',  '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', TRUE, now(), now()),
  ('00000000-0000-4000-8000-000000000041', 'ag1a.test@utel.edu.mx',   'Agente 1A (Norte)',     'agent',       '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', TRUE, now(), now()),
  ('00000000-0000-4000-8000-000000000042', 'ag1b.test@utel.edu.mx',   'Agente 1B (Norte)',     'agent',       '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', TRUE, now(), now()),
  ('00000000-0000-4000-8000-000000000051', 'ag2a.test@utel.edu.mx',   'Agente 2A (Sur)',       'agent',       '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', TRUE, now(), now()),
  ('00000000-0000-4000-8000-000000000052', 'ag2b.test@utel.edu.mx',   'Agente 2B (Sur)',       'agent',       '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', TRUE, now(), now())
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  area_id = EXCLUDED.area_id,
  team_id = EXCLUDED.team_id,
  full_name = EXCLUDED.full_name,
  is_active = TRUE,
  updated_at = now();

-- ── 3. TEAMS (with supervisor_id + coordinator_id) ─────
INSERT INTO public.teams (id, area_id, name, code, supervisor_id, coordinator_id, is_active, created_at, updated_at) VALUES
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'Equipo Alpha', 'TEST_ALPHA', '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000021', TRUE, now(), now()),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000002', 'Equipo Beta',  'TEST_BETA',  '00000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000022', TRUE, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  supervisor_id = EXCLUDED.supervisor_id,
  coordinator_id = EXCLUDED.coordinator_id,
  is_active = TRUE;

-- ── 4. AUTH.USERS (best-effort, guarded; not required for custom login) ──
DO $$
DECLARE
  v_email TEXT;
  v_uid UUID;
  v_name TEXT;
  v_user RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    FOR v_user IN
      SELECT * FROM (VALUES
        ('coord1.test@utel.edu.mx', '00000000-0000-4000-8000-000000000021'::uuid, 'Coordinadora 1 (Norte)'),
        ('coord2.test@utel.edu.mx', '00000000-0000-4000-8000-000000000022'::uuid, 'Coordinador 2 (Sur)'),
        ('sup1.test@utel.edu.mx',   '00000000-0000-4000-8000-000000000031'::uuid, 'Supervisor 1 (Norte)'),
        ('sup2.test@utel.edu.mx',   '00000000-0000-4000-8000-000000000032'::uuid, 'Supervisor 2 (Sur)'),
        ('ag1a.test@utel.edu.mx',   '00000000-0000-4000-8000-000000000041'::uuid, 'Agente 1A (Norte)'),
        ('ag1b.test@utel.edu.mx',   '00000000-0000-4000-8000-000000000042'::uuid, 'Agente 1B (Norte)'),
        ('ag2a.test@utel.edu.mx',   '00000000-0000-4000-8000-000000000051'::uuid, 'Agente 2A (Sur)'),
        ('ag2b.test@utel.edu.mx',   '00000000-0000-4000-8000-000000000052'::uuid, 'Agente 2B (Sur)')
      ) AS t(email, uid, name)
    LOOP
      v_email := v_user.email;
      v_uid := v_user.uid;
      v_name := v_user.name;
      BEGIN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
        VALUES (v_uid, v_email, '', now(), jsonb_build_object('full_name', v_name), now(), now())
        ON CONFLICT (email) DO UPDATE SET raw_user_meta_data = EXCLUDED.raw_user_meta_data;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[SEED] auth.users insert skipped for %', v_email;
      END;
    END LOOP;
  END IF;
END $$;

-- ── 5. DEMO CONTACTS (2 per agent) ─────────────────────
-- Uses first pipeline/stage to avoid depending on is_default column.
INSERT INTO public.contacts (id, full_name, phone, email, source, status, disposition, disposition_locked, assigned_to, area_id, team_id, pipeline_id, stage_id, metadata, last_activity_at, callback_at, created_at, updated_at) VALUES
  ('00000000-0000-4000-8000-000000000101', 'Cliente Norte 1A', '5551010001', 'cn1a@example.com', 'inbound', 'prospect', 'evaluando', FALSE, '00000000-0000-4000-8000-000000000041', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', (SELECT id FROM public.pipelines LIMIT 1), (SELECT id FROM public.stages LIMIT 1), '{}'::jsonb, now(), now() + interval '1 day', now(), now()),
  ('00000000-0000-4000-8000-000000000102', 'Cliente Norte 1B', '5551010002', 'cn1b@example.com', 'inbound', 'lead',     'cuelgue',      FALSE, '00000000-0000-4000-8000-000000000041', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', (SELECT id FROM public.pipelines LIMIT 1), (SELECT id FROM public.stages LIMIT 1), '{}'::jsonb, now(), NULL, now(), now()),
  ('00000000-0000-4000-8000-000000000103', 'Cliente Norte 1C', '5551010003', 'cn1c@example.com', 'inbound', 'customer', 'evaluando', FALSE, '00000000-0000-4000-8000-000000000042', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', (SELECT id FROM public.pipelines LIMIT 1), (SELECT id FROM public.stages LIMIT 1), '{}'::jsonb, now(), now() + interval '2 days', now(), now()),
  ('00000000-0000-4000-8000-000000000104', 'Cliente Norte 1D', '5551010004', 'cn1d@example.com', 'referral', 'lead',     'no_contactado', FALSE, '00000000-0000-4000-8000-000000000042', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', (SELECT id FROM public.pipelines LIMIT 1), (SELECT id FROM public.stages LIMIT 1), '{}'::jsonb, now(), NULL, now(), now()),
  ('00000000-0000-4000-8000-000000000105', 'Cliente Sur 2A',  '5552020001', 'cs2a@example.com', 'inbound', 'prospect', 'evaluando', FALSE, '00000000-0000-4000-8000-000000000051', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', (SELECT id FROM public.pipelines LIMIT 1), (SELECT id FROM public.stages LIMIT 1), '{}'::jsonb, now(), now() + interval '1 day', now(), now()),
  ('00000000-0000-4000-8000-000000000106', 'Cliente Sur 2B',  '5552020002', 'cs2b@example.com', 'inbound', 'lead',     'cuelgue',      FALSE, '00000000-0000-4000-8000-000000000051', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', (SELECT id FROM public.pipelines LIMIT 1), (SELECT id FROM public.stages LIMIT 1), '{}'::jsonb, now(), NULL, now(), now()),
  ('00000000-0000-4000-8000-000000000107', 'Cliente Sur 2C',  '5552020003', 'cs2c@example.com', 'inbound', 'customer', 'evaluando', FALSE, '00000000-0000-4000-8000-000000000052', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', (SELECT id FROM public.pipelines LIMIT 1), (SELECT id FROM public.stages LIMIT 1), '{}'::jsonb, now(), now() + interval '2 days', now(), now()),
  ('00000000-0000-4000-8000-000000000108', 'Cliente Sur 2D',  '5552020004', 'cs2d@example.com', 'referral', 'lead',     'no_contactado', FALSE, '00000000-0000-4000-8000-000000000052', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', (SELECT id FROM public.pipelines LIMIT 1), (SELECT id FROM public.stages LIMIT 1), '{}'::jsonb, now(), NULL, now(), now())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  assigned_to = EXCLUDED.assigned_to,
  area_id = EXCLUDED.area_id,
  team_id = EXCLUDED.team_id;

-- ── 6. DEMO AUDITORIAS (1 per team, linked to a contact) ──
INSERT INTO public.auditorias (id, contact_id, area_id, team_id, metadata, score, analysis, transcription, created_at, updated_at) VALUES
  ('test-alpha-001', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011',
   '{"fileName":"test-alpha-001.wav","agentName":"Agente 1A (Norte)","agentId":"00000000-0000-4000-8000-000000000041","category":"CALIDAD","status":"por_auditar","sentiment":"neutral"}'::jsonb,
   '{"total":82.5,"global":82.5}'::jsonb,
   '{}'::jsonb,
   '[]'::jsonb,
   now(), now()),
  ('test-beta-001', '00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012',
   '{"fileName":"test-beta-001.wav","agentName":"Agente 2A (Sur)","agentId":"00000000-0000-4000-8000-000000000051","category":"CALIDAD","status":"en_revision","sentiment":"positive"}'::jsonb,
   '{"total":91.0,"global":91.0}'::jsonb,
   '{}'::jsonb,
   '[]'::jsonb,
   now(), now())
ON CONFLICT (id) DO NOTHING;

-- ── 7. VERIFY ──────────────────────────────────────────
SELECT p.email, p.full_name, p.role, a.code AS area, t.code AS team, t.coordinator_id, t.supervisor_id
FROM public.profiles p
LEFT JOIN public.areas a ON a.id = p.area_id
LEFT JOIN public.teams t ON t.id = p.team_id
WHERE p.email LIKE '%.test@utel.edu.mx'
ORDER BY p.email;
