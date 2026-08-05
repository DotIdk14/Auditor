-- ============================================
-- Migration 015: Password hash for custom login
-- Users created from the UI can log in with email + password.
-- Google login stays as an optional linked method (same email = same profile).
-- Run with:
--   npx @insforge/cli db import apps/server/supabase/migrations/015_add_password.sql
-- ============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
