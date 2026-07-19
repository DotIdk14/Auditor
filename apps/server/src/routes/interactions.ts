import type { Express } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { authenticateToken, requireRole, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { insforge } from "../services/insforge.js";
import {
  upload,
  localInteractionsMemory, prependInteraction, getInteractionsByContact,
} from "../config.js";

const POSITIVE_TIPOS = ['Revisando Informacion', 'Seguimiento', 'Volver a llamar'];

const createInteractionSchema = z.object({
  contactId: z.string().min(1, "ID de contacto requerido"),
  type: z.enum(["llamada", "correo", "whatsapp"], "Tipo de interacción requerido"),
  tipo: z.string().min(1, "Tipo de tipificación requerido"),
  notes: z.string().max(2000).optional().nullable(),
});

function mapInteractionRow(row: any) {
  return {
    id: row.id,
    contact_id: row.contact_id,
    type: row.type,
    tipificacion: row.tipificacion,
    tipo: row.tipo || null,
    notes: row.notes || null,
    files: row.files || [],
    created_by: row.created_by || null,
    created_by_name: row.created_by_name || "Usuario",
    created_at: row.created_at,
  };
}

export default function (app: Express): void {
  // POST /api/interactions — Create interaction (with optional file uploads)
  app.post(
    "/api/interactions",
    authenticateToken,
    injectScope,
    requireRole("admin", "area_manager", "coordinator", "supervisor", "agent"),
    upload.array("files", 10),
    async (req: AuthenticatedRequest, res) => {
      try {
        const input = createInteractionSchema.parse(req.body);
        const files = (req.files as Express.Multer.File[]) || [];

        // Process uploaded files into base64 data URLs for localStorage storage
        const processedFiles = files.map((f) => ({
          name: f.originalname,
          type: f.mimetype,
          size: f.size,
          url: `data:${f.mimetype};base64,${f.buffer.toString("base64")}`,
        }));

        const tipificacion = POSITIVE_TIPOS.includes(input.tipo) ? "positiva" : "negativa";

        const ts = new Date().toISOString();
        const interaction: any = {
          id: randomUUID(),
          contact_id: input.contactId,
          type: input.type,
          tipificacion,
          tipo: input.tipo,
          notes: input.notes || null,
          files: processedFiles,
          created_by: req.scope?.userId || "unknown",
          created_by_name: (req as any).user?.displayName || "Usuario",
          created_at: ts,
        };

        // Try DB first
        const { error } = await insforge.database.from("interactions").insert({
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
        if (error) console.warn("[INTERACTIONS] DB insert error:", error.message);

        // Always store in local memory as fallback
        prependInteraction(interaction);

        // Auto-update contact disposition based on tipificacion
        if (tipificacion === "positiva") {
          const { updateContact } = await import("../services/contactService.js");
          await updateContact(
            input.contactId,
            { disposition: "evaluando", dispositionLocked: true },
            req.scope!
          );
        }

        res.status(201).json(interaction);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ error: "Datos inválidos", details: err.issues });
        }
        console.error("[INTERACTIONS] Error creating:", err.message);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // GET /api/contacts/:id/interactions — List interactions for a contact
  app.get("/api/contacts/:id/interactions", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const contactId = req.params.id;

      const { data, error } = await insforge.database
        .from("interactions")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return res.json(data.map(mapInteractionRow));
      }

      // Fallback to local memory
      const items = getInteractionsByContact(contactId);
      res.json(items.map(mapInteractionRow));
    } catch (err: any) {
      console.error("[INTERACTIONS] Error listing:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
}
