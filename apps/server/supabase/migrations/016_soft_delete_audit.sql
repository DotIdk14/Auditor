-- ============================================
-- Migration 016: Soft-delete de usuarios + audit log
-- 1) profiles.deleted_at / deleted_by → borrado recuperable
-- 2) Tabla audit_logs (filtrable por rol/área/equipo)
-- 3) Unique index en areas.code (evita duplicados)
-- 4) Limpieza del área "Alianzas" duplicada (se conserva la más nueva)
-- Run with:
--   npx @insforge/cli db import apps/server/supabase/migrations/016_soft_delete_audit.sql
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_label TEXT,
  area_id TEXT,
  team_id TEXT,
  changes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_role_idx ON public.audit_logs (actor_role);
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_idx ON public.audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS audit_logs_area_id_idx ON public.audit_logs (area_id);
CREATE INDEX IF NOT EXISTS audit_logs_team_id_idx ON public.audit_logs (team_id);
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON public.audit_logs (actor_id);

-- Limpieza del área duplicada "Alianzas" (se conserva e0420344-…, la más nueva)
DELETE FROM public.areas
WHERE id = 'de0bd1e4-e397-4756-afcf-5fb564d1ce22'
  AND NOT EXISTS (SELECT 1 FROM public.teams WHERE area_id = 'de0bd1e4-e397-4756-afcf-5fb564d1ce22');

-- Unique index en código de área (previene duplicados a nivel DB)
CREATE UNIQUE INDEX IF NOT EXISTS areas_code_unique ON public.areas (code);
