-- InsForge Migration: Create all tables for the Auditor Interno de Calidad
-- Run with: npx @insforge/cli db query "$(cat apps/server/supabase/migrations/009_insforge_tables.sql)"

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin','coordinator','supervisor','agent','qa','area_manager')),
  area_id UUID,
  team_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- AREAS (gerencias)
-- ============================================
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TEAMS (equipos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- ============================================
-- AUDITORIAS (calls/audits)
-- ============================================
CREATE TABLE IF NOT EXISTS public.auditorias (
  id TEXT PRIMARY KEY,
  contact_id UUID,
  area_id UUID REFERENCES public.areas(id),
  team_id UUID REFERENCES public.teams(id),
  metadata JSONB DEFAULT '{}',
  score JSONB DEFAULT '{}',
  analysis JSONB DEFAULT '{}',
  transcription JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTAS (notes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notas (
  id TEXT PRIMARY KEY,
  auditoria_id TEXT REFERENCES public.auditorias(id) ON DELETE CASCADE,
  supervisor_email TEXT NOT NULL,
  supervisor_name TEXT,
  segment_start DOUBLE PRECISION,
  segment_end DOUBLE PRECISION,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- OBJECIONES (objections)
-- ============================================
CREATE TABLE IF NOT EXISTS public.objeciones (
  id TEXT PRIMARY KEY,
  auditoria_id TEXT REFERENCES public.auditorias(id) ON DELETE CASCADE,
  supervisor_email TEXT NOT NULL,
  supervisor_name TEXT,
  segment_start DOUBLE PRECISION,
  segment_end DOUBLE PRECISION,
  tipo_objecion TEXT,
  severidad TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.objeciones ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONTACTS (CRM leads)
-- ============================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('inbound','outbound','referral','web','event','other','manual')),
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead','prospect','customer','churned')),
  disposition TEXT DEFAULT 'no_contactado' CHECK (disposition IN ('no_contactado','cuelgue','evaluando')),
  disposition_locked BOOLEAN DEFAULT false,
  assigned_to TEXT,
  area_id UUID,
  team_id UUID,
  pipeline_id UUID,
  stage_id UUID,
  metadata JSONB DEFAULT '{}',
  last_activity_at TIMESTAMPTZ,
  callback_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PIPELINES
-- ============================================
CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STAGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TASKS
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'follow_up' CHECK (type IN ('follow_up','callback','meeting','email','other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CALL GUIDES
-- ============================================
CREATE TABLE IF NOT EXISTS public.call_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  area_id UUID REFERENCES public.areas(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.call_guides ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INTERACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('llamada','correo','whatsapp','otro')),
  tipificacion TEXT CHECK (tipificacion IN ('positiva','negativa','neutral')),
  notes TEXT,
  files JSONB DEFAULT '[]',
  created_by TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (todas las tablas)
-- ============================================

-- Admin: full access
CREATE POLICY "admin_full_access" ON public.auditorias FOR ALL USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
);

-- Users can read their own area
CREATE POLICY "area_read" ON public.auditorias FOR SELECT USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE area_id = auditorias.area_id)
  OR auth.email() IN (SELECT email FROM public.profiles WHERE role IN ('admin','area_manager'))
);

-- Repeat similar policies for other tables
CREATE POLICY "contacts_admin_all" ON public.contacts FOR ALL USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "contacts_area_read" ON public.contacts FOR SELECT USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE area_id = contacts.area_id)
  OR auth.email() IN (SELECT email FROM public.profiles WHERE role IN ('admin','area_manager'))
);

CREATE POLICY "notas_admin_all" ON public.notas FOR ALL USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "objeciones_admin_all" ON public.objeciones FOR ALL USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "tasks_admin_all" ON public.tasks FOR ALL USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
);
