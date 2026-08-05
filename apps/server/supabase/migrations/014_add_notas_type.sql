-- ============================================
-- Migration 014: Tipo de nota explícito (quick | audit)
-- Formaliza el tipo que hasta ahora se infería por auditoria_id.
--   quick → nota libre sin llamada vinculada
--   audit → nota anclada a un segmento de una auditoría
-- Idempotente. Run with:
--   npx @insforge/cli db query "$(cat apps/server/supabase/migrations/014_add_notas_type.sql)"
-- ============================================

ALTER TABLE public.notas ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'audit';

-- Backfill: filas sin auditoría (o sin segmentos) eran notas rápidas
UPDATE public.notas SET type = 'quick'
WHERE type = 'audit'
  AND (auditoria_id IS NULL OR (segment_start IS NULL AND segment_end IS NULL));

CREATE INDEX IF NOT EXISTS idx_notas_type ON public.notas (type);
CREATE INDEX IF NOT EXISTS idx_notas_type_created ON public.notas (type, created_at DESC);
