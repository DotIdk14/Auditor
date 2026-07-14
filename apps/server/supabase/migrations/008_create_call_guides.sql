-- 008: Create call_guides table for storing advisor call session state
CREATE TABLE IF NOT EXISTS call_guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_name TEXT,
  career TEXT,
  call_steps JSONB DEFAULT '[]'::jsonb,
  current_step INTEGER DEFAULT 0,
  final_decision TEXT CHECK (final_decision IN ('yes', 'no')),
  notes JSONB DEFAULT '[]'::jsonb,
  safe_checklist JSONB DEFAULT '[]'::jsonb,
  profile_tags JSONB DEFAULT '{"trabaja":false,"tieneHijos":false,"preocupadoCostos":false}'::jsonb,
  variables JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE call_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own call guides"
  ON call_guides FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own call guides"
  ON call_guides FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own call guides"
  ON call_guides FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Supervisors can read team call guides"
  ON call_guides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()::text
      AND profiles.role IN ('admin', 'coordinator', 'area_manager', 'supervisor')
    )
  );

-- Index for fast lookups
CREATE INDEX idx_call_guides_user_id ON call_guides(user_id);
CREATE INDEX idx_call_guides_created_at ON call_guides(created_at DESC);
