-- ============================================
-- Cotizaciones UTEL: snapshot completo de cada cotización generada
-- Vinculada a un contacto y con la interacción correspondiente.
-- Almacena los detalles del programa, precios, beneficios y los
-- speeches/objeciones usados durante la llamada.
-- ============================================

CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_by TEXT,
  created_by_name TEXT,
  area_id UUID,
  team_id UUID,
  programa TEXT,
  nivel TEXT,
  jornada TEXT,
  lead TEXT,
  zona TEXT,
  fecha_inicio TEXT,
  experiencia TEXT,
  modalidad TEXT,
  beneficios JSONB DEFAULT '{}',
  pricing JSONB DEFAULT '{}',
  resumen_programa TEXT,
  advisor_name TEXT,
  proposal_status TEXT DEFAULT 'revision',
  used_speeches JSONB DEFAULT '[]',
  used_objections JSONB DEFAULT '[]',
  notes TEXT,
  interaction_type TEXT,
  interaction_tipo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

-- Admin: acceso completo
CREATE POLICY "cotizaciones_admin_all" ON public.cotizaciones FOR ALL USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
);

-- Lectura: usuarios autenticados con perfil (mismo criterio que contacts)
CREATE POLICY "cotizaciones_read_authenticated" ON public.cotizaciones FOR SELECT USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role IN ('admin', 'area_manager', 'coordinator', 'supervisor', 'agent', 'qa'))
);

-- Insert: usuarios autenticados con perfil (el servidor asigna area/team según scope)
CREATE POLICY "cotizaciones_insert_authenticated" ON public.cotizaciones FOR INSERT WITH CHECK (
  auth.email() IN (SELECT email FROM public.profiles WHERE role IN ('admin', 'area_manager', 'coordinator', 'supervisor', 'agent'))
);

-- Update: admin o usuarios del área del contacto
CREATE POLICY "cotizaciones_update_authenticated" ON public.cotizaciones FOR UPDATE USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
  OR auth.email() IN (SELECT email FROM public.profiles WHERE area_id = cotizaciones.area_id)
) WITH CHECK (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
  OR auth.email() IN (SELECT email FROM public.profiles WHERE area_id = cotizaciones.area_id)
);

-- Delete: admin y managers
CREATE POLICY "cotizaciones_delete_authenticated" ON public.cotizaciones FOR DELETE USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role IN ('admin', 'area_manager', 'coordinator', 'supervisor'))
);
