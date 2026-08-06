import type { Express } from "express";
import axios from "axios";
import { randomUUID } from "crypto";
import { z } from "zod";
import { authenticateToken, requireRole, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { GEMINI_API_KEY, GEMINI_MODEL, prependInteraction } from "../config.js";
import {
  getCotizadorSettings,
  upsertCotizadorSettings,
} from "../services/cotizadorService.js";
import {
  createCotizacion,
  getCotizacion,
  listCotizacionesByContact,
  deleteCotizacion,
} from "../services/cotizacionService.js";
import { createContact, getContact, updateContact } from "../services/contactService.js";
import { insforge } from "../services/insforge.js";

const POSITIVE_TIPOS = ["Revisando Informacion", "Seguimiento", "Volver a llamar", "Cotización enviada"];

const usedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

const createCotizacionSchema = z.object({
  contactId: z.string().min(1).optional(),
  contact: z.object({
    fullName: z.string().min(1, "El nombre es obligatorio").max(200),
    phone: z.string().optional().nullable().or(z.literal("")),
    email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
    educationLevel: z.string().optional(),
    educationProgram: z.string().optional(),
    disposition: z.enum(["no_contactado", "cuelgue", "evaluando"]).optional(),
    callbackAt: z.string().optional().nullable(),
  }).optional(),
  interaction: z.object({
    type: z.enum(["llamada", "correo", "whatsapp"]).optional().default("llamada"),
    tipo: z.string().optional().default("Cotización enviada"),
    notes: z.string().max(3000).optional().nullable(),
  }).optional(),
  quote: z.object({
    programa: z.string().optional().nullable(),
    nivel: z.string().optional().nullable(),
    jornada: z.string().optional().nullable(),
    lead: z.string().optional().nullable(),
    zona: z.string().optional().nullable(),
    fechaInicio: z.string().optional().nullable(),
    experiencia: z.string().optional().nullable(),
    modalidad: z.string().optional().nullable(),
    beneficios: z.record(z.string(), z.unknown()).optional(),
    pricing: z.record(z.string(), z.unknown()).optional(),
    resumenPrograma: z.string().optional().nullable(),
    advisorName: z.string().optional().nullable(),
    proposalStatus: z.string().optional().nullable(),
    usedSpeeches: z.array(usedItemSchema).optional(),
    usedObjections: z.array(usedItemSchema).optional(),
    notes: z.string().max(3000).optional().nullable(),
  }).optional(),
});

const SYSTEM_PROMPT =
  "Eres un amiguito experto que ayuda a los vendedores de UTEL. Responde cortito y de forma muy amable.";

export default function (app: Express): void {
  // GET /api/cotizador/settings — Config global de la calculadora (precios, matriz, colores)
  app.get("/api/cotizador/settings", authenticateToken, async (_req: AuthenticatedRequest, res) => {
    try {
      const settings = await getCotizadorSettings();
      return res.json({ success: true, settings });
    } catch (err: any) {
      console.error("[COTIZADOR] Error getting settings:", err.message);
      return res.status(500).json({ error: "Error al obtener la configuración del cotizador" });
    }
  });

  // POST /api/cotizador/settings — Solo admin. Upsert de cualquier campo (merge sobre lo existente)
  app.post("/api/cotizador/settings", authenticateToken, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const body = req.body || {};
      const partial: Partial<Record<string, unknown>> = {};
      if (body.domiciliacion !== undefined) partial.domiciliacion = Number(body.domiciliacion) || 5;
      if (body.tituloCosto0 !== undefined) partial.tituloCosto0 = Boolean(body.tituloCosto0);
      if (body.platziPreview !== undefined) partial.platziPreview = Boolean(body.platziPreview);
      if (body.primaryColor !== undefined) partial.primaryColor = String(body.primaryColor);
      if (body.firmaCopiar !== undefined) partial.firmaCopiar = Boolean(body.firmaCopiar);
      if (body.bloquearInspeccion !== undefined) partial.bloquearInspeccion = Boolean(body.bloquearInspeccion);
      if (body.precios !== undefined) partial.precios = body.precios;
      if (body.prog !== undefined) partial.prog = body.prog;
      if (body.accs !== undefined) partial.accs = body.accs;

      const settings = await upsertCotizadorSettings(partial as any);
      return res.json({ success: true, settings });
    } catch (err: any) {
      console.error("[COTIZADOR] Error saving settings:", err.message);
      return res.status(500).json({ error: "Error al guardar la configuración del cotizador" });
    }
  });

  // POST /api/cotizador/chat — Asistente Gemini (con fallback a OpenAI) para vendedores UTEL
  app.post("/api/cotizador/chat", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { message, history } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "¡Olvidaste escribir tu mensaje!" });
    }

    try {
      // 1. Gemini (REST v1beta, mismo patrón que el resto del servidor)
      if (GEMINI_API_KEY) {
        const model = GEMINI_MODEL || "gemini-2.0-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

        const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
        if (Array.isArray(history)) {
          for (const h of history) {
            const role = h?.role === "user" ? "user" : "model";
            const text = Array.isArray(h?.parts) && typeof h.parts[0]?.text === "string"
              ? h.parts[0].text
              : "";
            if (text) contents.push({ role, parts: [{ text }] });
          }
        }
        contents.push({ role: "user", parts: [{ text: message }] });

        const response = await axios.post(
          url,
          {
            contents,
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { temperature: 0.4 },
          },
          { timeout: 30000 },
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return res.json({ text });
        console.warn("[COTIZADOR][CHAT] Gemini respondió vacío:", response.data?.candidates?.[0]?.finishReason);
      }

      // 2. Fallback: OpenAI (REST, sin SDK)
      if (process.env.OPENAI_API_KEY) {
        const messages: Array<{ role: string; content: string }> = [
          { role: "system", content: SYSTEM_PROMPT },
        ];
        if (Array.isArray(history)) {
          for (const h of history) {
            const role = h?.role === "user" ? "user" : "assistant";
            const text = Array.isArray(h?.parts) && typeof h.parts[0]?.text === "string"
              ? h.parts[0].text
              : "";
            if (text) messages.push({ role, content: text });
          }
        }
        messages.push({ role: "user", content: message });

        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          { model: "gpt-4o-mini", messages, stream: false },
          { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, timeout: 30000 },
        );
        const text = response.data?.choices?.[0]?.message?.content;
        if (text) return res.json({ text });
      }

      return res.status(500).json({ error: "El robot tuvo un problema al pensar (ningún modelo disponible)." });
    } catch (err: any) {
      console.error("[COTIZADOR][CHAT] Error:", err.message);
      return res.status(500).json({ error: "El robot tuvo un problema al pensar. Intenta de nuevo." });
    }
  });

  // ── Cotizaciones guardadas ─────────────────────────────────────────

  // POST /api/cotizaciones — Guardar cotización (contacto existente o nuevo) + interacción
  app.post("/api/cotizaciones", authenticateToken, injectScope, requireRole("admin", "area_manager", "coordinator", "supervisor", "agent"), async (req: AuthenticatedRequest, res) => {
    try {
      const input = createCotizacionSchema.parse(req.body);

      // 1. Resolver contacto (existente o crear uno nuevo)
      let contact: any = null;
      if (input.contactId) {
        contact = await getContact(input.contactId, req.scope!);
        if (!contact) return res.status(404).json({ error: "Contacto no encontrado" });
      } else if (input.contact) {
        const c = input.contact;
        contact = await createContact({
          fullName: c.fullName,
          phone: c.phone || null,
          email: c.email || null,
          disposition: c.disposition,
          callbackAt: c.callbackAt ? new Date(c.callbackAt).toISOString() : undefined,
          metadata: c.educationLevel || c.educationProgram
            ? { educationLevel: c.educationLevel || "", educationProgram: c.educationProgram || "" }
            : undefined,
        }, req.scope!.userId, req.scope!);
      } else {
        return res.status(400).json({ error: "Se requiere contactId o los datos del nuevo contacto" });
      }

      // 2. Guardar cotización
      const quoteInput = input.quote || {};
      const createdByName = (req as any).user?.displayName || "Usuario";
      const cotizacion = await createCotizacion({
        contactId: contact.id,
        programa: quoteInput.programa || null,
        nivel: quoteInput.nivel || null,
        jornada: quoteInput.jornada || null,
        lead: quoteInput.lead || null,
        zona: quoteInput.zona || null,
        fechaInicio: quoteInput.fechaInicio || null,
        experiencia: quoteInput.experiencia || null,
        modalidad: quoteInput.modalidad || null,
        beneficios: quoteInput.beneficios || {},
        pricing: quoteInput.pricing || {},
        resumenPrograma: quoteInput.resumenPrograma || null,
        advisorName: quoteInput.advisorName || null,
        proposalStatus: quoteInput.proposalStatus || "revision",
        usedSpeeches: quoteInput.usedSpeeches || [],
        usedObjections: quoteInput.usedObjections || [],
        notes: quoteInput.notes || null,
        interactionType: input.interaction?.type || "llamada",
        interactionTipo: input.interaction?.tipo || "Cotización enviada",
      }, req.scope!, createdByName);

      // 3. Crear interacción asociada
      const tipo = input.interaction?.tipo || "Cotización enviada";
      const tipificacion = POSITIVE_TIPOS.includes(tipo) ? "positiva" : "negativa";

      const pricing = quoteInput.pricing || {};
      const pagoRef = (pricing as any).referencia || (pricing as any).mes1 || (pricing as any).ultimo;
      const summaryParts = [];
      if (quoteInput.programa) summaryParts.push(`Programa: ${quoteInput.programa}`);
      if (quoteInput.jornada) summaryParts.push(`Jornada: ${quoteInput.jornada}`);
      if (typeof pagoRef === "number") summaryParts.push(`Cuota: $${pagoRef.toLocaleString("es-MX")}`);
      if (typeof (pricing as any).becaPct === "number") summaryParts.push(`Beca: ${(pricing as any).becaPct}%`);
      if ((quoteInput.usedSpeeches as any[])?.length) summaryParts.push(`Speeches usados: ${(quoteInput.usedSpeeches as any[]).length}`);
      if ((quoteInput.usedObjections as any[])?.length) summaryParts.push(`Objeciones atendidas: ${(quoteInput.usedObjections as any[]).length}`);
      const summary = summaryParts.length ? summaryParts.join(" · ") : "Cotización generada";

      const interaction: any = {
        id: randomUUID(),
        contact_id: contact.id,
        type: input.interaction?.type || "llamada",
        tipificacion,
        tipo,
        notes: input.interaction?.notes?.trim()
          ? `${summary}\n${input.interaction.notes.trim()}`
          : summary,
        files: [],
        created_by: req.scope?.userId || "unknown",
        created_by_name: createdByName,
        created_at: new Date().toISOString(),
      };

      const { error: ixErr } = await insforge.database.from("interactions").insert({
        id: interaction.id,
        contact_id: interaction.contact_id,
        type: interaction.type,
        tipificacion: interaction.tipificacion,
        tipo: interaction.tipo,
        notes: interaction.notes,
        files: interaction.files,
        created_by: interaction.created_by,
        created_by_name: interaction.created_by_name,
      });
      if (ixErr) console.warn("[COTIZACIONES] DB interaction insert error:", ixErr.message);
      prependInteraction(interaction);

      if (tipificacion === "positiva") {
        await updateContact(contact.id, { disposition: "evaluando", dispositionLocked: true }, req.scope!);
      }

      return res.status(201).json({ success: true, cotizacion, contact, interaction });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: err.issues });
      }
      console.error("[COTIZACIONES] Error creating:", err.message, JSON.stringify(err));
      return res.status(500).json({ error: "Error al guardar la cotización" });
    }
  });

  // GET /api/contacts/:id/cotizaciones — Listar cotizaciones de un contacto
  app.get("/api/contacts/:id/cotizaciones", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const items = await listCotizacionesByContact(req.params.id, req.scope!);
      return res.json(items);
    } catch (err: any) {
      console.error("[COTIZACIONES] Error listing:", err.message);
      return res.status(500).json({ error: "Error al listar cotizaciones" });
    }
  });

  // GET /api/cotizaciones/:id — Obtener una cotización
  app.get("/api/cotizaciones/:id", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const cotizacion = await getCotizacion(req.params.id, req.scope!);
      if (!cotizacion) return res.status(404).json({ error: "Cotización no encontrada" });
      return res.json(cotizacion);
    } catch (err: any) {
      console.error("[COTIZACIONES] Error getting:", err.message);
      return res.status(500).json({ error: "Error al obtener cotización" });
    }
  });

  // DELETE /api/cotizaciones/:id — Eliminar una cotización
  app.delete("/api/cotizaciones/:id", authenticateToken, injectScope, requireRole("admin", "area_manager", "coordinator", "supervisor"), async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await deleteCotizacion(req.params.id, req.scope!);
      if (!deleted) return res.status(404).json({ error: "Cotización no encontrada" });
      return res.json({ success: true, message: "Cotización eliminada" });
    } catch (err: any) {
      console.error("[COTIZACIONES] Error deleting:", err.message);
      return res.status(500).json({ error: "Error al eliminar cotización" });
    }
  });
}
