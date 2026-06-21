-- Migration 006: Seed initial data (areas, teams, pipeline stages)
-- Run after all previous migrations

-- ════════════════════════════════════════════════════════════════
-- 1. SEED AREAS (Gerencias/Direcciones)
-- ════════════════════════════════════════════════════════════════
INSERT INTO areas (name, code, description) VALUES
  ('Ventas Norte', 'VENTAS_NORTE', 'Equipos de ventas región norte'),
  ('Ventas Sur', 'VENTAS_SUR', 'Equipos de ventas región sur'),
  ('Retención', 'RETENCION', 'Equipo de retención y fidelización'),
  ('B2B Corporativo', 'B2B', 'Ventas a empresas y corporativos')
ON CONFLICT (code) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- 2. SEED TEAMS (Equipos dentro de áreas)
-- ════════════════════════════════════════════════════════════════
INSERT INTO teams (area_id, name, code)
SELECT a.id, t.name, t.code
FROM areas a
CROSS JOIN (VALUES
  ('Alpha', 'ALPHA'),
  ('Beta', 'BETA'),
  ('Gamma', 'GAMMA')
) AS t(name, code)
ON CONFLICT (area_id, code) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- 3. SEED DEFAULT PIPELINE (if not already exists)
-- ════════════════════════════════════════════════════════════════
INSERT INTO pipelines (name, description, is_default)
SELECT 'Pipeline Principal', 'Pipeline por defecto para ventas', TRUE
WHERE NOT EXISTS (SELECT 1 FROM pipelines WHERE is_default = TRUE);

-- ════════════════════════════════════════════════════════════════
-- 4. SEED PIPELINE STAGES (if not already exists)
-- ════════════════════════════════════════════════════════════════
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
  AND NOT EXISTS (SELECT 1 FROM pipeline_stages ps WHERE ps.pipeline_id = p.id AND ps.name = s.name);
