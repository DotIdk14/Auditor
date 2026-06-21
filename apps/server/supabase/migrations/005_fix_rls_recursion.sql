-- Migration 005: Fix RLS recursion in helper functions
-- Use CREATE OR REPLACE to preserve dependent policies

-- ════════════════════════════════════════════════════════════════
-- 1. Recreate helper functions with SECURITY DEFINER
-- (CREATE OR REPLACE preserves dependent policies)
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT
LANGUAGE SQL STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION current_user_area_id()
RETURNS UUID
LANGUAGE SQL STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT area_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION current_user_team_id()
RETURNS UUID
LANGUAGE SQL STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM profiles WHERE id = auth.uid()
$$;
