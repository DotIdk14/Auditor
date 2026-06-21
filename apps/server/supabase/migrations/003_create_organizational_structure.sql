-- Migration 003: Organizational Structure (Areas, Teams, CRM Core)
-- Run: supabase db push OR psql -f this_file.sql
-- Creates: areas, teams, contacts, pipelines, pipeline_stages, tasks
-- Modifies: profiles (add role, area_id, team_id), auditorias (add contact_id)

-- ════════════════════════════════════════════════════════════════
-- 1. AREAS (Gerencias/Direcciones)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  manager_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE areas IS 'Organizational areas (e.g. Ventas Norte, Retención, B2B)';

CREATE INDEX IF NOT EXISTS idx_areas_manager_id ON areas (manager_id);
CREATE INDEX IF NOT EXISTS idx_areas_is_active ON areas (is_active);

-- ════════════════════════════════════════════════════════════════
-- 2. TEAMS (Equipos dentro de un área)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  supervisor_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (area_id, code)
);

COMMENT ON TABLE teams IS 'Teams within an area, each led by a supervisor';

CREATE INDEX IF NOT EXISTS idx_teams_area_id ON teams (area_id);
CREATE INDEX IF NOT EXISTS idx_teams_supervisor_id ON teams (supervisor_id);
CREATE INDEX IF NOT EXISTS idx_teams_is_active ON teams (is_active);

-- ════════════════════════════════════════════════════════════════
-- 3. PROFILES (Extensión de auth.users con roles jerárquicos)
-- ════════════════════════════════════════════════════════════════
-- Si la tabla profiles no existe, créala desde cero
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'area_manager', 'coordinator', 'supervisor', 'agent', 'qa')),
  area_id UUID REFERENCES areas(id),
  team_id UUID REFERENCES teams(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Si ya existe solo agregamos columnas faltantes
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    BEGIN
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'area_manager', 'coordinator', 'supervisor', 'agent', 'qa'));
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

COMMENT ON TABLE profiles IS 'User profiles with hierarchical role and organizational structure';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_area_id ON profiles (area_id);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON profiles (team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_area ON profiles (role, area_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);

-- ════════════════════════════════════════════════════════════════
-- 4. CONTACTS (Leads/Clientes - Core del CRM)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  source TEXT DEFAULT 'inbound' CHECK (source IN ('inbound', 'outbound', 'referral', 'web', 'event', 'other', 'manual')),
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'prospect', 'customer', 'churned')),
  assigned_to UUID NOT NULL REFERENCES auth.users(id),
  area_id UUID REFERENCES areas(id),
  team_id UUID REFERENCES teams(id),
  pipeline_id UUID, -- FK se agrega después de crear pipelines
  stage_id UUID,    -- FK se agrega después de crear pipeline_stages
  metadata JSONB DEFAULT '{}'::jsonb,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE contacts IS 'CRM contacts/leads/clients with hierarchical area/team assignment';

CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON contacts (assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_area_id ON contacts (area_id);
CREATE INDEX IF NOT EXISTS idx_contacts_team_id ON contacts (team_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts (status);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts (phone);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);
CREATE INDEX IF NOT EXISTS idx_contacts_last_activity ON contacts (last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_stage_id ON contacts (stage_id);

-- ════════════════════════════════════════════════════════════════
-- 5. PIPELINES (Configurables por área)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  area_id UUID REFERENCES areas(id), -- NULL = global
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pipelines IS 'Sales pipelines, configurable per area or global';

CREATE INDEX IF NOT EXISTS idx_pipelines_area_id ON pipelines (area_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_default ON pipelines (is_default) WHERE is_default = TRUE;

-- ════════════════════════════════════════════════════════════════
-- 6. PIPELINE STAGES (Etapas del Kanban)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#6366f1',
  is_closed_won BOOLEAN NOT NULL DEFAULT FALSE,
  is_closed_lost BOOLEAN NOT NULL DEFAULT FALSE,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pipeline_id, display_order)
);

COMMENT ON TABLE pipeline_stages IS 'Pipeline stages/columns for Kanban view';

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON pipeline_stages (pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON pipeline_stages (pipeline_id, display_order);

-- ════════════════════════════════════════════════════════════════
-- 7. TASKS (Tareas y seguimientos)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES auth.users(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  type TEXT NOT NULL DEFAULT 'follow_up' CHECK (type IN ('call', 'email', 'meeting', 'follow_up', 'demo', 'proposal', 'other')),
  area_id UUID REFERENCES areas(id),
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tasks IS 'Tasks/follow-ups linked to contacts with hierarchical scope';

CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON tasks (contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_area_id ON tasks (area_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks (team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks (priority);

-- ════════════════════════════════════════════════════════════════
-- 8. AÑADIR FKs PENDIENTES
-- ════════════════════════════════════════════════════════════════
ALTER TABLE contacts ADD CONSTRAINT fk_contacts_pipeline 
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE SET NULL;

ALTER TABLE contacts ADD CONSTRAINT fk_contacts_stage 
  FOREIGN KEY (stage_id) REFERENCES pipeline_stages(id) ON DELETE SET NULL;

-- ════════════════════════════════════════════════════════════════
-- 9. MODIFICAR AUDITORIAS EXISTENTES
-- ════════════════════════════════════════════════════════════════
ALTER TABLE auditorias ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE auditorias ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id);
ALTER TABLE auditorias ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);

CREATE INDEX IF NOT EXISTS idx_auditorias_contact_id ON auditorias (contact_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_area_id ON auditorias (area_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_team_id ON auditorias (team_id);

-- ════════════════════════════════════════════════════════════════
-- 10. AUTO-UPDATE TRIGGERS
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
DO $$
DECLARE
  tables_with_updated_at TEXT[] := ARRAY['areas', 'teams', 'profiles', 'contacts', 'pipelines', 'pipeline_stages', 'tasks'];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables_with_updated_at
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
      CREATE TRIGGER trg_%s_updated_at
        BEFORE UPDATE ON %s
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;
