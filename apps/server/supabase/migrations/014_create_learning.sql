-- 014: Learning system — AI-generated speeches from best calls
-- Learned speech catalog (result of an admin regeneration)
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

-- Singleton row tracking the last regeneration
CREATE TABLE IF NOT EXISTS learning_meta (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_regenerated_at TIMESTAMPTZ,
  last_regenerated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT learning_meta_single_row CHECK (id = 1)
);

INSERT INTO learning_meta (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
