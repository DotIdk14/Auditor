-- ============================================
-- Cotizador UTEL: settings de la calculadora (singleton)
-- Reemplaza JSONBin y prices.json como fuente de verdad.
-- precios/prog/accs: JSONB con la matriz y precios custom del admin.
-- ============================================

CREATE TABLE IF NOT EXISTS cotizador_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  domiciliacion INTEGER NOT NULL DEFAULT 5,
  titulo_costo_0 BOOLEAN NOT NULL DEFAULT FALSE,
  platzi_preview BOOLEAN NOT NULL DEFAULT FALSE,
  primary_color TEXT NOT NULL DEFAULT '#39B54A',
  firma_copiar BOOLEAN NOT NULL DEFAULT FALSE,
  bloquear_inspeccion BOOLEAN NOT NULL DEFAULT FALSE,
  precios JSONB,
  prog JSONB,
  accs JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cotizador_settings_single_row CHECK (id = 1)
);

INSERT INTO cotizador_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Lectura: cualquier usuario autenticado con perfil puede leer la config
CREATE POLICY "cotizador_settings_read_authenticated" ON public.cotizador_settings FOR SELECT USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role IN ('admin', 'area_manager', 'coordinator', 'supervisor', 'agent'))
);

-- Escritura: solo admins (coincide con el chequeo de rol del servidor)
CREATE POLICY "cotizador_settings_admin_all" ON public.cotizador_settings FOR ALL USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
) WITH CHECK (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
);
