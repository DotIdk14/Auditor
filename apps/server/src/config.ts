import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";
import multer from "multer";
import rateLimit from "express-rate-limit";

export const PORT = parseInt(process.env.PORT || "3000", 10);

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRY = "24h";

// ── AI Provider: Google Gemini ─────────────────────────────────
export const AI_PROVIDER = process.env.AI_PROVIDER || "gemini";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: { transport: WebSocket as any },
    })
  : null;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
/** Supabase admin client that BYPASSES RLS — only for use in login/auth flows */
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      realtime: { transport: WebSocket as any },
    })
  : null;

// ── Shared in-memory state (backup when Supabase unavailable) ─────

export let localCallsMemory: any[] = [];
export let localContactsMemory: any[] = [];
export const audioBuffers = new Map<string, Buffer>();

export const pendingTranscripts = new Map<string, {
  transcriptId: string;
  audioBuffer: Buffer;
  fileName: string;
  callId: string;
  timestamp: number;
}>();

export const localNotasMemory = new Map<string, any[]>();
export const localObjecionesMemory = new Map<string, any[]>();
export let localInteractionsMemory: any[] = [];

// ── Mutator helpers (for ESM live-binding reassignment) ───────────

export function setLocalCallsMemory(calls: any[]): void {
  localCallsMemory = calls;
}

export function prependCall(call: any): void {
  localCallsMemory = [call, ...localCallsMemory];
}

export function prependAndRemoveCall(newCall: any, callId: string): void {
  localCallsMemory = [newCall, ...localCallsMemory.filter(c => c.id !== callId)];
}

export function removeCallById(callId: string): void {
  localCallsMemory = localCallsMemory.filter(c => c.id !== callId);
}

export function setLocalContactsMemory(contacts: any[]): void {
  localContactsMemory = contacts;
}

export function prependContact(contact: any): void {
  localContactsMemory = [contact, ...localContactsMemory];
}

export function updateContactInMemory(id: string, updates: Partial<any>): any | null {
  const idx = localContactsMemory.findIndex(c => c.id === id);
  if (idx === -1) return null;
  localContactsMemory[idx] = { ...localContactsMemory[idx], ...updates };
  return localContactsMemory[idx];
}

export function removeContactById(id: string): boolean {
  const len = localContactsMemory.length;
  localContactsMemory = localContactsMemory.filter(c => c.id !== id);
  return localContactsMemory.length < len;
}

export function prependInteraction(interaction: any): void {
  localInteractionsMemory = [interaction, ...localInteractionsMemory];
}

export function getInteractionsByContact(contactId: string): any[] {
  return localInteractionsMemory.filter(i => i.contact_id === contactId);
}

// ── Multer upload config ──────────────────────────────────────────

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ── Rate limiter for login ────────────────────────────────────────

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesión." },
});
