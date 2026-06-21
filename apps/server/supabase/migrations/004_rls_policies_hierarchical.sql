-- Migration 004: Hierarchical RLS Policies
-- Run after: 003_create_organizational_structure.sql
-- Enforces strict area/team isolation for all CRM tables

-- ════════════════════════════════════════════════════════════════
-- 1. ENABLE ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT
LANGUAGE SQL STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Helper function to get current user's area_id
CREATE OR REPLACE FUNCTION current_user_area_id()
RETURNS UUID
LANGUAGE SQL STABLE
AS $$
  SELECT area_id FROM profiles WHERE id = auth.uid()
$$;

-- Helper function to get current user's team_id
CREATE OR REPLACE FUNCTION current_user_team_id()
RETURNS UUID
LANGUAGE SQL STABLE
AS $$
  SELECT team_id FROM profiles WHERE id = auth.uid()
$$;

-- ════════════════════════════════════════════════════════════════
-- 2. AREAS POLICIES
-- ════════════════════════════════════════════════════════════════
-- 2a. Admin: full access
DROP POLICY IF EXISTS "admin_all_areas" ON areas;
CREATE POLICY "admin_all_areas" ON areas
  FOR ALL USING (current_user_role() = 'admin');

-- 2b. Area managers and coordinators: only their own area
DROP POLICY IF EXISTS "manager_coord_own_area" ON areas;
CREATE POLICY "manager_coord_own_area" ON areas
  FOR ALL USING (
    current_user_role() IN ('area_manager', 'coordinator')
    AND id = current_user_area_id()
  );

-- 2c. Supervisor/agent/qa: read only, only their own area
DROP POLICY IF EXISTS "member_view_own_area" ON areas;
CREATE POLICY "member_view_own_area" ON areas
  FOR SELECT USING (
    current_user_role() IN ('supervisor', 'agent', 'qa')
    AND id = current_user_area_id()
  );

-- ════════════════════════════════════════════════════════════════
-- 3. TEAMS POLICIES
-- ════════════════════════════════════════════════════════════════
-- 3a. Admin: full access
DROP POLICY IF EXISTS "admin_all_teams" ON teams;
CREATE POLICY "admin_all_teams" ON teams
  FOR ALL USING (current_user_role() = 'admin');

-- 3b. Area manager: all teams in their area (full CRUD)
DROP POLICY IF EXISTS "area_manager_all_teams" ON teams;
CREATE POLICY "area_manager_all_teams" ON teams
  FOR ALL USING (
    current_user_role() = 'area_manager'
    AND area_id = current_user_area_id()
  );

-- 3c. Coordinator: all teams in their area (read + insert/update, no delete)
DROP POLICY IF EXISTS "coordinator_manage_teams" ON teams;
CREATE POLICY "coordinator_manage_teams" ON teams
  FOR INSERT WITH CHECK (
    current_user_role() = 'coordinator'
    AND area_id = current_user_area_id()
  );

DROP POLICY IF EXISTS "coordinator_update_teams" ON teams;
CREATE POLICY "coordinator_update_teams" ON teams
  FOR UPDATE USING (
    current_user_role() = 'coordinator'
    AND area_id = current_user_area_id()
  );

DROP POLICY IF EXISTS "coordinator_view_teams" ON teams;
CREATE POLICY "coordinator_view_teams" ON teams
  FOR SELECT USING (
    current_user_role() = 'coordinator'
    AND area_id = current_user_area_id()
  );

-- 3d. Supervisor: only their own team (read)
DROP POLICY IF EXISTS "supervisor_own_team" ON teams;
CREATE POLICY "supervisor_own_team" ON teams
  FOR SELECT USING (
    current_user_role() = 'supervisor'
    AND id = current_user_team_id()
  );

-- 3e. Agent/QA: only their own team (read)
DROP POLICY IF EXISTS "member_own_team" ON teams;
CREATE POLICY "member_own_team" ON teams
  FOR SELECT USING (
    current_user_role() IN ('agent', 'qa')
    AND id = current_user_team_id()
  );

-- ════════════════════════════════════════════════════════════════
-- 4. PROFILES POLICIES
-- ════════════════════════════════════════════════════════════════
-- 4a. Everyone can see their own profile
DROP POLICY IF EXISTS "own_profile" ON profiles;
CREATE POLICY "own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- 4b. Admin: all profiles
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (current_user_role() = 'admin');

-- 4c. Area manager: all profiles in their area
DROP POLICY IF EXISTS "area_manager_area_profiles" ON profiles;
CREATE POLICY "area_manager_area_profiles" ON profiles
  FOR ALL USING (
    current_user_role() = 'area_manager'
    AND area_id = current_user_area_id()
  );

-- 4d. Coordinator: read profiles in their area + non-sensitive update
DROP POLICY IF EXISTS "coordinator_view_profiles" ON profiles;
CREATE POLICY "coordinator_view_profiles" ON profiles
  FOR SELECT USING (
    current_user_role() = 'coordinator'
    AND area_id = current_user_area_id()
  );

DROP POLICY IF EXISTS "coordinator_update_profiles" ON profiles;
CREATE POLICY "coordinator_update_profiles" ON profiles
  FOR UPDATE USING (
    current_user_role() = 'coordinator'
    AND area_id = current_user_area_id()
  );

-- 4e. Supervisor: profiles in their team
DROP POLICY IF EXISTS "supervisor_team_profiles" ON profiles;
CREATE POLICY "supervisor_team_profiles" ON profiles
  FOR SELECT USING (
    current_user_role() = 'supervisor'
    AND team_id = current_user_team_id()
  );

-- 4f. Agent/QA: only see their own (handled by "own_profile")

-- ════════════════════════════════════════════════════════════════
-- 5. CONTACTS POLICIES
-- ════════════════════════════════════════════════════════════════
-- 5a. Admin: full access to all contacts
DROP POLICY IF EXISTS "admin_all_contacts" ON contacts;
CREATE POLICY "admin_all_contacts" ON contacts
  FOR ALL USING (current_user_role() = 'admin');

-- 5b. Area manager: all contacts in their area (full CRUD)
DROP POLICY IF EXISTS "area_manager_area_contacts" ON contacts;
CREATE POLICY "area_manager_area_contacts" ON contacts
  FOR ALL USING (
    current_user_role() = 'area_manager'
    AND area_id = current_user_area_id()
  );

-- 5c. Coordinator: all contacts in their area (full CRUD)
DROP POLICY IF EXISTS "coordinator_area_contacts" ON contacts;
CREATE POLICY "coordinator_area_contacts" ON contacts
  FOR ALL USING (
    current_user_role() = 'coordinator'
    AND area_id = current_user_area_id()
  );

-- 5d. Supervisor: contacts in their team (full CRUD)
DROP POLICY IF EXISTS "supervisor_team_contacts" ON contacts;
CREATE POLICY "supervisor_team_contacts" ON contacts
  FOR ALL USING (
    current_user_role() = 'supervisor'
    AND team_id = current_user_team_id()
  );

-- 5e. Agent: only their own assigned contacts (read + manage)
DROP POLICY IF EXISTS "agent_own_contacts_read" ON contacts;
CREATE POLICY "agent_own_contacts_read" ON contacts
  FOR SELECT USING (
    current_user_role() = 'agent'
    AND assigned_to = auth.uid()
  );

DROP POLICY IF EXISTS "agent_own_contacts_insert" ON contacts;
CREATE POLICY "agent_own_contacts_insert" ON contacts
  FOR INSERT WITH CHECK (
    current_user_role() = 'agent'
    AND assigned_to = auth.uid()
  );

DROP POLICY IF EXISTS "agent_own_contacts_update" ON contacts;
CREATE POLICY "agent_own_contacts_update" ON contacts
  FOR UPDATE USING (
    current_user_role() = 'agent'
    AND assigned_to = auth.uid()
  );

--- Agents can NOT delete contacts (only admin/manager/coordinator/supervisor)

-- 5f. QA: read-only access to contacts in their area
DROP POLICY IF EXISTS "qa_area_contacts_read" ON contacts;
CREATE POLICY "qa_area_contacts_read" ON contacts
  FOR SELECT USING (
    current_user_role() = 'qa'
    AND area_id = current_user_area_id()
  );

-- ════════════════════════════════════════════════════════════════
-- 6. PIPELINES POLICIES
-- ════════════════════════════════════════════════════════════════
-- 6a. Admin: full access
DROP POLICY IF EXISTS "admin_all_pipelines" ON pipelines;
CREATE POLICY "admin_all_pipelines" ON pipelines
  FOR ALL USING (current_user_role() = 'admin');

-- 6b. Area manager: pipelines in their area + global (full CRUD)
DROP POLICY IF EXISTS "area_manager_area_pipelines" ON pipelines;
CREATE POLICY "area_manager_area_pipelines" ON pipelines
  FOR ALL USING (
    current_user_role() = 'area_manager'
    AND (area_id IS NULL OR area_id = current_user_area_id())
  );

-- 6c. Coordinator: read pipelines in their area + global
DROP POLICY IF EXISTS "coordinator_view_pipelines" ON pipelines;
CREATE POLICY "coordinator_view_pipelines" ON pipelines
  FOR SELECT USING (
    current_user_role() = 'coordinator'
    AND (area_id IS NULL OR area_id = current_user_area_id())
  );

-- 6d. Supervisor/Agent/QA: read own pipelines
DROP POLICY IF EXISTS "member_view_pipelines" ON pipelines;
CREATE POLICY "member_view_pipelines" ON pipelines
  FOR SELECT USING (
    current_user_role() IN ('supervisor', 'agent', 'qa')
    AND (area_id = current_user_area_id() OR area_id IS NULL)
  );

-- ════════════════════════════════════════════════════════════════
-- 7. PIPELINE STAGES POLICIES
-- ════════════════════════════════════════════════════════════════
-- Visibility is inherited from parent pipeline
DROP POLICY IF EXISTS "stages_via_pipeline" ON pipeline_stages;
CREATE POLICY "stages_via_pipeline" ON pipeline_stages
  FOR SELECT USING (
    pipeline_id IN (
      SELECT id FROM pipelines
      WHERE area_id IS NULL
         OR area_id = current_user_area_id()
    )
  );

-- Management: admin + area_manager
DROP POLICY IF EXISTS "admin_manage_stages" ON pipeline_stages;
CREATE POLICY "admin_manage_stages" ON pipeline_stages
  FOR ALL USING (
    current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "area_manager_manage_stages" ON pipeline_stages;
CREATE POLICY "area_manager_manage_stages" ON pipeline_stages
  FOR ALL USING (
    current_user_role() = 'area_manager'
    AND pipeline_id IN (
      SELECT id FROM pipelines
      WHERE area_id = current_user_area_id()
    )
  );

-- ════════════════════════════════════════════════════════════════
-- 8. TASKS POLICIES
-- ════════════════════════════════════════════════════════════════
-- 8a. Admin: full access
DROP POLICY IF EXISTS "admin_all_tasks" ON tasks;
CREATE POLICY "admin_all_tasks" ON tasks
  FOR ALL USING (current_user_role() = 'admin');

-- 8b. Area manager: all tasks in their area (full CRUD)
DROP POLICY IF EXISTS "area_manager_area_tasks" ON tasks;
CREATE POLICY "area_manager_area_tasks" ON tasks
  FOR ALL USING (
    current_user_role() = 'area_manager'
    AND area_id = current_user_area_id()
  );

-- 8c. Coordinator: all tasks in their area (full CRUD)
DROP POLICY IF EXISTS "coordinator_area_tasks" ON tasks;
CREATE POLICY "coordinator_area_tasks" ON tasks
  FOR ALL USING (
    current_user_role() = 'coordinator'
    AND area_id = current_user_area_id()
  );

-- 8d. Supervisor: tasks in their team (full CRUD)
DROP POLICY IF EXISTS "supervisor_team_tasks" ON tasks;
CREATE POLICY "supervisor_team_tasks" ON tasks
  FOR ALL USING (
    current_user_role() = 'supervisor'
    AND team_id = current_user_team_id()
  );

-- 8e. Agent: only tasks assigned to them (read + update status)
DROP POLICY IF EXISTS "agent_own_tasks_read" ON tasks;
CREATE POLICY "agent_own_tasks_read" ON tasks
  FOR SELECT USING (
    current_user_role() = 'agent'
    AND assigned_to = auth.uid()
  );

DROP POLICY IF EXISTS "agent_own_tasks_update" ON tasks;
CREATE POLICY "agent_own_tasks_update" ON tasks
  FOR UPDATE USING (
    current_user_role() = 'agent'
    AND assigned_to = auth.uid()
  );

-- 8f. QA: read-only tasks in their area
DROP POLICY IF EXISTS "qa_area_tasks_read" ON tasks;
CREATE POLICY "qa_area_tasks_read" ON tasks
  FOR SELECT USING (
    current_user_role() = 'qa'
    AND area_id = current_user_area_id()
  );

-- ════════════════════════════════════════════════════════════════
-- 9. AUDITORIAS (RLS adicional para area/team)
-- ════════════════════════════════════════════════════════════════
-- Admin: all
DROP POLICY IF EXISTS "admin_all_auditorias" ON auditorias;
CREATE POLICY "admin_all_auditorias" ON auditorias
  FOR ALL USING (current_user_role() = 'admin');

-- Area manager: auditorias in their area
DROP POLICY IF EXISTS "area_manager_area_auditorias" ON auditorias;
CREATE POLICY "area_manager_area_auditorias" ON auditorias
  FOR ALL USING (
    current_user_role() = 'area_manager'
    AND area_id = current_user_area_id()
  );

-- Coordinator: auditorias in their area
DROP POLICY IF EXISTS "coordinator_area_auditorias" ON auditorias;
CREATE POLICY "coordinator_area_auditorias" ON auditorias
  FOR ALL USING (
    current_user_role() = 'coordinator'
    AND area_id = current_user_area_id()
  );

-- Supervisor: auditorias in their team
DROP POLICY IF EXISTS "supervisor_team_auditorias" ON auditorias;
CREATE POLICY "supervisor_team_auditorias" ON auditorias
  FOR ALL USING (
    current_user_role() = 'supervisor'
    AND team_id = current_user_team_id()
  );

-- Agent: only their own assigned auditorias (by contact)
DROP POLICY IF EXISTS "agent_own_auditorias" ON auditorias;
CREATE POLICY "agent_own_auditorias" ON auditorias
  FOR SELECT USING (
    current_user_role() = 'agent'
    AND contact_id IN (
      SELECT id FROM contacts WHERE assigned_to = auth.uid()
    )
  );

-- QA: auditorias in their area (full access for auditing)
DROP POLICY IF EXISTS "qa_area_auditorias" ON auditorias;
CREATE POLICY "qa_area_auditorias" ON auditorias
  FOR ALL USING (
    current_user_role() = 'qa'
    AND area_id = current_user_area_id()
  );

-- ════════════════════════════════════════════════════════════════
-- 10. SEED DEFAULT DATA (pipeline + stages)
-- ════════════════════════════════════════════════════════════════
-- Insert default pipeline (global) if not exists
INSERT INTO pipelines (name, description, is_default, is_active)
SELECT 'Pipeline Principal', 'Pipeline por defecto para ventas', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM pipelines WHERE is_default = TRUE);

-- Insert default stages for the default pipeline
INSERT INTO pipeline_stages (pipeline_id, name, display_order, color, is_closed_won, is_closed_lost, probability)
SELECT p.id, s.name, s.display_order, s.color, s.is_won, s.is_lost, s.prob
FROM pipelines p
CROSS JOIN (VALUES
  ('Nuevo', 1, '#94a3b8', false, false, 10),
  ('Contactado', 2, '#3b82f6', false, false, 25),
  ('Calificado', 3, '#06b6d4', false, false, 40),
  ('Propuesta', 4, '#8b5cf6', false, false, 60),
  ('Negociación', 5, '#f59e0b', false, false, 80),
  ('Cerrado Ganado', 6, '#22c55e', true, false, 100),
  ('Cerrado Perdido', 7, '#ef4444', false, true, 0)
) AS s(name, display_order, color, is_won, is_lost, prob)
WHERE p.is_default = TRUE
  AND NOT EXISTS (SELECT 1 FROM pipeline_stages ps WHERE ps.pipeline_id = p.id);
