-- Migration: Create auditorias table for persistent call storage
-- Run: supabase db push OR psql -f this_file.sql

CREATE TABLE IF NOT EXISTS auditorias (
  id TEXT PRIMARY KEY,
  metadata JSONB NOT NULL,
  score JSONB NOT NULL,
  analysis JSONB NOT NULL,
  transcription JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on created_at for efficient listing
CREATE INDEX IF NOT EXISTS idx_auditorias_created_at ON auditorias (created_at DESC);

-- Index on metadata->>'fileName' for searching
CREATE INDEX IF NOT EXISTS idx_auditorias_filename ON auditorias ((metadata->>'fileName'));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_auditorias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditorias_updated_at ON auditorias;
CREATE TRIGGER trg_auditorias_updated_at
  BEFORE UPDATE ON auditorias
  FOR EACH ROW EXECUTE FUNCTION update_auditorias_updated_at();
