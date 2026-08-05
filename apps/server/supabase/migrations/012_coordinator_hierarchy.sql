-- ============================================
-- Migration 012: Coordinador → Supervisor → Asesor
-- Adds coordinator_id to teams and defensive columns
-- so the schema matches apps/server/src/types.ts
-- regardless of which base migration (003 or 009) is live.
-- Idempotent. Run with:
--   npx @insforge/cli db query "$(cat apps/server/supabase/migrations/012_coordinator_hierarchy.sql)"
-- ============================================

-- ── TEAMS ─────────────────────────────────────────────
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS coordinator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_teams_coordinator_id ON public.teams (coordinator_id);
CREATE INDEX IF NOT EXISTS idx_teams_supervisor_id ON public.teams (supervisor_id);
CREATE INDEX IF NOT EXISTS idx_teams_is_active ON public.teams (is_active);

-- Unique per area+code (guarded, may already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'teams_area_id_code_key'
      AND conrelid = 'public.teams'::regclass
  ) THEN
    ALTER TABLE public.teams ADD CONSTRAINT teams_area_id_code_key UNIQUE (area_id, code);
  END IF;
END $$;

-- ── AREAS ─────────────────────────────────────────────
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_areas_manager_id ON public.areas (manager_id);
CREATE INDEX IF NOT EXISTS idx_areas_is_active ON public.areas (is_active);

-- ── PROFILES (defensive) ──────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ── updated_at trigger (defensive, matches 003) ───────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['teams', 'areas', 'profiles']::TEXT[]
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s;
      CREATE TRIGGER trg_%s_updated_at
        BEFORE UPDATE ON public.%s
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;
