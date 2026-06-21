-- Migration: Create notas and objeciones tables for supervisor audit annotations
-- Run: supabase db push OR psql -f this_file.sql

-- ── Notas (supervisor notes on transcription segments) ──────────
-- Purpose: Supervisors can annotate specific segments of a transcription with free-text notes

CREATE TABLE IF NOT EXISTS notas (
  id TEXT PRIMARY KEY,
  auditoria_id TEXT NOT NULL REFERENCES auditorias(id) ON DELETE CASCADE,
  supervisor_email TEXT NOT NULL,
  supervisor_name TEXT NOT NULL,
  segment_start FLOAT NOT NULL,
  segment_end FLOAT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notas IS 'Supervisor free-text notes anchored to transcription segments';

-- Indexes for notas
CREATE INDEX IF NOT EXISTS idx_notas_auditoria_id ON notas (auditoria_id);
CREATE INDEX IF NOT EXISTS idx_notas_supervisor_email ON notas (supervisor_email);
CREATE INDEX IF NOT EXISTS idx_notas_created_at ON notas (created_at DESC);

-- ── Objeciones (supervisor objection flags on transcription segments) ──────────
-- Purpose: Supervisors flag problematic segments with categorized objections

CREATE TABLE IF NOT EXISTS objeciones (
  id TEXT PRIMARY KEY,
  auditoria_id TEXT NOT NULL REFERENCES auditorias(id) ON DELETE CASCADE,
  supervisor_email TEXT NOT NULL,
  supervisor_name TEXT NOT NULL,
  segment_start FLOAT NOT NULL,
  segment_end FLOAT NOT NULL,
  tipo_objecion TEXT NOT NULL,
  severidad TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE objeciones IS 'Supervisor objection flags on transcription segments with type and severity';

-- Indexes for objeciones
CREATE INDEX IF NOT EXISTS idx_objeciones_auditoria_id ON objeciones (auditoria_id);
CREATE INDEX IF NOT EXISTS idx_objeciones_supervisor_email ON objeciones (supervisor_email);
CREATE INDEX IF NOT EXISTS idx_objeciones_severidad ON objeciones (severidad);
CREATE INDEX IF NOT EXISTS idx_objeciones_created_at ON objeciones (created_at DESC);

-- ── Auto-update triggers ────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_notas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notas_updated_at ON notas;
CREATE TRIGGER trg_notas_updated_at
  BEFORE UPDATE ON notas
  FOR EACH ROW EXECUTE FUNCTION update_notas_updated_at();

CREATE OR REPLACE FUNCTION update_objeciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_objeciones_updated_at ON objeciones;
CREATE TRIGGER trg_objeciones_updated_at
  BEFORE UPDATE ON objeciones
  FOR EACH ROW EXECUTE FUNCTION update_objeciones_updated_at();

-- ── RLS Policies ────────────────────────────────────────────────
-- Enable RLS on both tables
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE objeciones ENABLE ROW LEVEL SECURITY;

-- Notas: only authenticated users can read
DROP POLICY IF EXISTS "Allow read all notas" ON notas;
CREATE POLICY "Allow read all notas" ON notas
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Notas: insert only for authenticated users
DROP POLICY IF EXISTS "Allow insert own notas" ON notas;
CREATE POLICY "Allow insert own notas" ON notas
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND supervisor_email = auth.email());

-- Notas: update/delete only for own records
DROP POLICY IF EXISTS "Allow update own notas" ON notas;
CREATE POLICY "Allow update own notas" ON notas
  FOR UPDATE
  USING (supervisor_email = auth.email());

DROP POLICY IF EXISTS "Allow delete own notas" ON notas;
CREATE POLICY "Allow delete own notas" ON notas
  FOR DELETE
  USING (supervisor_email = auth.email());

-- Objeciones: only authenticated users can read
DROP POLICY IF EXISTS "Allow read all objeciones" ON objeciones;
CREATE POLICY "Allow read all objeciones" ON objeciones
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Objeciones: insert only for authenticated users with own email
DROP POLICY IF EXISTS "Allow insert own objeciones" ON objeciones;
CREATE POLICY "Allow insert own objeciones" ON objeciones
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND supervisor_email = auth.email());

-- Objeciones: update/delete only for own records
DROP POLICY IF EXISTS "Allow update own objeciones" ON objeciones;
CREATE POLICY "Allow update own objeciones" ON objeciones
  FOR UPDATE
  USING (supervisor_email = auth.email());

DROP POLICY IF EXISTS "Allow delete own objeciones" ON objeciones;
CREATE POLICY "Allow delete own objeciones" ON objeciones
  FOR DELETE
  USING (supervisor_email = auth.email());
