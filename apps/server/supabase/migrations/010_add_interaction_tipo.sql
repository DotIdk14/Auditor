ALTER TABLE public.interactions ADD COLUMN IF NOT EXISTS tipo TEXT;

-- Allow the new tipo values in the existing tipificacion check
ALTER TABLE public.interactions DROP CONSTRAINT IF EXISTS interactions_tipificacion_check;
ALTER TABLE public.interactions ADD CONSTRAINT interactions_tipificacion_check
  CHECK (tipificacion IN ('positiva','negativa','neutral'));
