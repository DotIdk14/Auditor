-- ============================================
-- Learning system: AI-generated speeches from best calls
-- learned_speeches: catalog of AI speeches (result of an admin regeneration)
-- learning_meta: singleton tracking the last regeneration
-- ============================================

CREATE TABLE IF NOT EXISTS learned_speeches (
  id TEXT PRIMARY KEY,
  section_id TEXT,
  objection_id TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_call_count INTEGER DEFAULT 0,
  avg_score NUMERIC DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learned_speeches_section ON learned_speeches(section_id);
CREATE INDEX IF NOT EXISTS idx_learned_speeches_objection ON learned_speeches(objection_id);

CREATE TABLE IF NOT EXISTS learning_meta (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_regenerated_at TIMESTAMPTZ,
  last_regenerated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT learning_meta_single_row CHECK (id = 1)
);

INSERT INTO learning_meta (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- SELECT: any authenticated user with a profile can read speeches
CREATE POLICY "learned_speeches_read_authenticated" ON public.learned_speeches FOR SELECT USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role IN ('admin', 'area_manager', 'coordinator', 'supervisor', 'agent'))
);

-- Write: only admins regenerate (matches server-side role check)
CREATE POLICY "learned_speeches_admin_all" ON public.learned_speeches FOR ALL USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
) WITH CHECK (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
);

-- meta: readable by any authenticated user, writable only by admins
CREATE POLICY "learning_meta_read_authenticated" ON public.learning_meta FOR SELECT USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role IN ('admin', 'area_manager', 'coordinator', 'supervisor', 'agent'))
);

CREATE POLICY "learning_meta_admin_all" ON public.learning_meta FOR ALL USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
) WITH CHECK (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
);
