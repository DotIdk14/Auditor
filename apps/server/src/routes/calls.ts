import type { Express } from "express";
import axios from "axios";
import { z } from "zod";
import {
  supabase,
  supabaseAdmin,
  IS_DEMO_MODE,
  localCallsMemory,
  demoContactsList,
  audioBuffers,
  localNotasMemory,
  localObjecionesMemory,
  prependCall,
  prependAndRemoveCall,
  removeCallById,
} from "../config.js";
import { authenticateToken, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { saveCallToSupabase, deleteCallFromSupabase } from "../services/supabase.js";
import { generateLocalAnalysis } from "../services/analysis.js";
import { generateHighFidelitySimulatedCall } from "../__fixtures__/simulated-calls.js";
import { generateDemoCalls, generateDemoNotes } from "../services/demoSeeder.js";
import * as contactService from "../services/contactService.js";

// Seed demo data for calls/llamadas endpoint
let callsDemoSeeded = false;
function seedCallsDemo() {
  if (!callsDemoSeeded && IS_DEMO_MODE && localCallsMemory.length === 0) {
    const calls = generateDemoCalls();
    localCallsMemory.push(...calls);
    // Seed notes
    const notes = generateDemoNotes();
    for (const [callId, callNotes] of Object.entries(notes)) {
      localNotasMemory.set(callId, callNotes);
    }
    callsDemoSeeded = true;
    console.log(`[DEMO_CALLS] ${calls.length} llamadas demo cargadas`);
  }
}

export default function (app: Express): void {
  // POST /api/cargar-demo — Load a demo/test call
  app.post("/api/cargar-demo", (req, res) => {
    const uniqueId = `call_demo_${Date.now()}`;
    const demoCall = generateHighFidelitySimulatedCall(
      `Llamada_Comercial_Demo_UTEL_${Math.floor(Math.random() * 90 + 10)}.mp3`,
      4829310,
      uniqueId,
    );
    prependCall(demoCall);
    if (!IS_DEMO_MODE) {
      saveCallToSupabase(demoCall);
    }
    return res.json(demoCall);
  });

  // POST /api/llamadas/:id/assign-contact — Assign a contact to a pending call and save to DB
  app.post("/api/llamadas/:id/assign-contact", authenticateToken, injectScope, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      // Validate input: either contactId (existing) OR fullName (new contact)
      const schema = z.object({
        contactId: z.string().optional(),
        fullName: z.string().min(1).optional(),
        phone: z.string().optional().nullable(),
        email: z.string().email().optional().nullable(),
      });
      const input = schema.parse(req.body);

      if (!input.contactId && !input.fullName) {
        return res.status(400).json({ error: "Debes proporcionar un contactId o un fullName para crear un nuevo contacto." });
      }

      // ── Find the call: memory first, then Supabase ────────────
      let call: any = null;
      const memIdx = localCallsMemory.findIndex((c: any) => c.id === id);

      if (memIdx !== -1) {
        call = { ...localCallsMemory[memIdx] };
        console.log(`[ASSIGN_CONTACT] Found call ${id} in memory`);
      } else if (supabase) {
        // Fallback: look up in Supabase (Vercel cold start / different instance)
        console.log(`[ASSIGN_CONTACT] Call ${id} not in memory, searching Supabase...`);
        const { data: dbCall, error: dbErr } = await (supabaseAdmin || supabase)
          .from("auditorias")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (dbErr) {
          console.warn(`[ASSIGN_CONTACT] Supabase lookup error: ${dbErr.message}`);
        }

        if (dbCall) {
          call = {
            id: dbCall.id,
            contact_id: dbCall.contact_id || null,
            area_id: dbCall.area_id || null,
            team_id: dbCall.team_id || null,
            status: dbCall.metadata?.status || null,
            metadata: dbCall.metadata || {},
            score: dbCall.score || { global: 0 },
            analysis: dbCall.analysis || {},
            transcription: dbCall.transcription || [],
          };
          // Also add to memory for future requests
          localCallsMemory.unshift(call);
          console.log(`[ASSIGN_CONTACT] Restored call ${id} from Supabase to memory`);
        }
      }

      if (!call) {
        return res.status(404).json({
          error: "Llamada no encontrada.",
          detail: "La llamada no existe en memoria ni en la base de datos. Es posible que el audio no se haya subido correctamente.",
          callId: id,
        });
      }

      let finalContactId = input.contactId;

      // If no contactId provided, create a new contact
      if (!finalContactId) {
        if (IS_DEMO_MODE) {
          // Demo mode: create in-memory contact
          const newContact = {
            id: `demo-contact-${Date.now()}`,
            full_name: input.fullName!,
            phone: input.phone || null,
            email: input.email || null,
            company: null,
            source: "manual",
            status: "lead",
            assigned_to: req.scope!.userId,
            area_id: req.scope!.areaId || null,
            team_id: req.scope!.teamId || null,
            metadata: {},
            last_activity_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          demoContactsList.unshift(newContact);
          finalContactId = newContact.id;
        } else {
          // Real mode: create contact via contactService
          const newContact = await contactService.createContact(
            {
              fullName: input.fullName!,
              phone: input.phone || null,
              email: input.email || null,
              source: "manual",
            },
            req.scope!.userId,
            req.scope!,
          );
          finalContactId = newContact.id;
        }
      }

      // Verify the contact exists (if using existing contactId)
      if (input.contactId && supabase) {
        const { data: contactExists } = await (supabaseAdmin || supabase)
          .from("contacts")
          .select("id")
          .eq("id", finalContactId)
          .maybeSingle();
        if (!contactExists) {
          return res.status(404).json({
            error: "Contacto no encontrado.",
            detail: "El contactId proporcionado no existe en la base de datos.",
          });
        }
      }

      // Update the call with contact_id and new status
      call.contact_id = finalContactId;
      call.status = 'por_auditar';
      if (!call.metadata) call.metadata = {};
      call.metadata.status = 'por_auditar';
      call.metadata.contactId = finalContactId;
      // Inherit area/team from scope
      if (!call.area_id) call.area_id = req.scope!.areaId || null;
      if (!call.team_id) call.team_id = req.scope!.teamId || null;

      // Replace in localCallsMemory if it was there
      if (memIdx !== -1) {
        prependAndRemoveCall(call, id);
      } else {
        localCallsMemory.unshift(call);
      }

      // Save to Supabase with contact_id
      await saveCallToSupabase(call);

      console.log(`[ASSIGN_CONTACT] Call ${id} assigned to contact ${finalContactId} — saved to DB`);

      return res.json({
        success: true,
        call: {
          id: call.id,
          contact_id: call.contact_id,
          status: call.status,
          metadata: call.metadata,
        },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: err.issues });
      }
      console.error("[ASSIGN_CONTACT] Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/llamadas — List all calls
  app.get("/api/llamadas", (req, res) => {
    seedCallsDemo();
    return res.json(localCallsMemory);
  });

  // DELETE /api/llamadas/:id — Delete a call
  app.delete("/api/llamadas/:id", (req, res) => {
    const callId = req.params.id;
    audioBuffers.delete(callId);
    removeCallById(callId);
    if (!IS_DEMO_MODE) {
      deleteCallFromSupabase(callId);
    }
    return res.json({ success: true });
  });

  // POST /api/drive-import — Import and audit a call from Google Drive
  app.post("/api/drive-import", async (req, res) => {
    const { fileId, fileName, accessToken } = req.body;

    if (!fileId || !accessToken) {
      return res.status(400).json({ error: "File ID y Access Token son requeridos." });
    }

    try {
      console.log(`[DRIVE] Descargando archivo ${fileName} (${fileId}) de Google Drive...`);

      const driveResponse = await axios({
        method: "get",
        url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: "arraybuffer",
      });

      const audioBuffer = Buffer.from(driveResponse.data);
      const audioSize = audioBuffer.length;
      console.log(`[DRIVE] Archivo descargado exitosamente. Tamaño: ${audioSize} bytes.`);

      let analysis: any;
      const uniqueId = `drive_${fileId.slice(0, 8)}_${Date.now()}`;
      const ext = fileName.split(".").pop()?.toLowerCase() || "mp3";

      console.log("[DRIVE] Procesando con AssemblyAI + Ollama...");
      analysis = await generateLocalAnalysis(audioBuffer, ext === "wav" ? "wav" : "mp3", fileName);

      const newCall: any = {
        id: uniqueId,
        metadata: {
          fileName,
          duration: analysis.duration || 0,
          uploadedAt: new Date().toISOString(),
          uploadedBy: "Supervisor (Drive Import)",
          status: "completed",
        },
        analysis,
        score: {
          global: (analysis.utel?.totalScore || 0) * 10,
          criteria: analysis.utel?.checklist?.map((item: any) => ({
            name: item.title,
            score: (item.score / item.weight) * 100,
            weight: item.weight,
          })) || [],
        },
        transcription: analysis.transcription || [],
      };

      audioBuffers.set(uniqueId, audioBuffer);
      localCallsMemory.unshift(newCall);
      saveCallToSupabase(newCall);
      res.json(newCall);
    } catch (err: any) {
      console.error("[DRIVE_ERROR] Fallo al procesar archivo de Drive:", err.message);
      res.status(500).json({
        error: `Error al importar de Drive: ${err.response?.data?.error || err.message}`,
      });
    }
  });

  // POST /api/drive-save — Save audit to Google Drive
  app.post("/api/drive-save", async (req, res) => {
    const { callData, accessToken } = req.body;

    if (!callData || !accessToken) {
      return res.status(400).json({ error: "Datos de llamada y token son requeridos." });
    }

    try {
      const folderName = "Auditorías PCE UTEL";

      let folderId = "";
      const searchFolder = await axios.get(
        `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&supportsAllDrives=true&includeItemsFromAllDrives=true`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (searchFolder.data.files.length > 0) {
        folderId = searchFolder.data.files[0].id;
      } else {
        const createFolder = await axios.post(
          "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true",
          { name: folderName, mimeType: "application/vnd.google-apps.folder" },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        folderId = createFolder.data.id;
      }

      const fileName = `Audit_${callData.metadata.fileName.replace(/\.[^/.]+$/, "")}_${Date.now()}.json`;
      const metadata = {
        name: fileName,
        parents: [folderId],
        mimeType: "application/json",
      };

      const formData = new FormData();
      formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      formData.append("file", new Blob([JSON.stringify(callData)], { type: "application/json" }));

      const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true";
      const boundary = "auditor_pce_boundary";
      const body =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        `${JSON.stringify(callData)}\r\n` +
        `--${boundary}--`;

      await axios.post(uploadUrl, body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
      });

      return res.json({ success: true, message: "Auditoría guardada en Drive." });
    } catch (error: any) {
      console.error("Error al guardar en Drive:", error.response?.data || error.message);
      return res.status(500).json({
        error: `Fallo al guardar en Google Drive: ${error.response?.data?.error?.message || error.message}`,
      });
    }
  });

  // GET /api/drive-history — List audit history from Google Drive
  app.get("/api/drive-history", async (req, res) => {
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({ error: "Token es requerido." });
    }

    try {
      const folderName = "Auditorías PCE UTEL";

      const searchFolder = await axios.get(
        `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&supportsAllDrives=true&includeItemsFromAllDrives=true`,
        { headers: { Authorization: `Bearer ${accessToken as string}` } },
      );

      if (searchFolder.data.files.length === 0) {
        return res.json({ calls: [] });
      }

      const folderId = searchFolder.data.files[0].id;

      const listFiles = await axios.get(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType='application/json' and trashed=false&fields=files(id, name)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
        { headers: { Authorization: `Bearer ${accessToken as string}` } },
      );

      const files = listFiles.data.files;
      const calls = [];

      for (const file of files.slice(0, 10)) {
        try {
          const fileContent = await axios.get(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`,
            { headers: { Authorization: `Bearer ${accessToken as string}` } },
          );
          if (fileContent.data && fileContent.data.id) {
            calls.push(fileContent.data);
          }
        } catch (e) {
          console.warn(`No se pudo leer el archivo ${file.name} de Drive.`);
        }
      }

      return res.json({ calls });
    } catch (error: any) {
      console.error("Error al listar Drive:", error.response?.data || error.message);
      return res.status(500).json({
        error: `Fallo al recuperar historial de Google Drive: ${error.response?.data?.error?.message || error.message}`,
      });
    }
  });

  // GET /api/supervisores/:email/historial — Supervisor activity history
  app.get("/api/supervisores/:email/historial", async (req, res) => {
    const supervisorEmail = req.params.email;

    if (!supabase) {
      const historial = localCallsMemory
        .filter((call: any) => {
          const notasForCall = localNotasMemory.get(call.id) || [];
          const objecionesForCall = localObjecionesMemory.get(call.id) || [];
          return (
            notasForCall.some((n: any) => n.supervisorEmail === supervisorEmail) ||
            objecionesForCall.some((o: any) => o.supervisorEmail === supervisorEmail) ||
            (call.metadata?.uploadedBy && call.metadata.uploadedBy.includes(supervisorEmail))
          );
        })
        .map((call: any) => {
          const notasForCall = (localNotasMemory.get(call.id) || []).filter(
            (n: any) => n.supervisorEmail === supervisorEmail,
          );
          const objecionesForCall = (localObjecionesMemory.get(call.id) || []).filter(
            (o: any) => o.supervisorEmail === supervisorEmail,
          );
          return {
            ...call,
            notasCount: notasForCall.length,
            objecionesCount: objecionesForCall.length,
          };
        })
        .sort(
          (a: any, b: any) =>
            new Date(b.metadata.uploadedAt).getTime() - new Date(a.metadata.uploadedAt).getTime(),
        );

      return res.json({ supervisorEmail, totalAuditorias: historial.length, auditorias: historial });
    }

    try {
      const [{ data: notasAuditorias }, { data: objecionesAuditorias }] = await Promise.all([
        (supabaseAdmin || supabase).from("notas").select("auditoria_id").eq("supervisor_email", supervisorEmail),
        (supabaseAdmin || supabase).from("objeciones").select("auditoria_id").eq("supervisor_email", supervisorEmail),
      ]);

      const auditoriaIds = new Set<string>();
      (notasAuditorias || []).forEach((n: any) => auditoriaIds.add(n.auditoria_id));
      (objecionesAuditorias || []).forEach((o: any) => auditoriaIds.add(o.auditoria_id));

      if (auditoriaIds.size === 0) {
        const { data: uploadedCalls } = await (supabaseAdmin || supabase)
          .from("auditorias")
          .select("id")
          .filter("metadata->>uploadedBy", "ilike", `%${supervisorEmail}%`)
          .limit(50);
        (uploadedCalls || []).forEach((c: any) => auditoriaIds.add(c.id));
      }

      if (auditoriaIds.size === 0) {
        return res.json({ supervisorEmail, totalAuditorias: 0, auditorias: [] });
      }

      const ids = Array.from(auditoriaIds).slice(0, 50);
      const { data: auditorias } = await (supabaseAdmin || supabase)
        .from("auditorias")
        .select("*")
        .in("id", ids)
        .order("created_at", { ascending: false });

      const { data: allNotas } = await (supabaseAdmin || supabase)
        .from("notas")
        .select("auditoria_id")
        .in("auditoria_id", ids)
        .eq("supervisor_email", supervisorEmail);
      const { data: allObjeciones } = await (supabaseAdmin || supabase)
        .from("objeciones")
        .select("auditoria_id")
        .in("auditoria_id", ids)
        .eq("supervisor_email", supervisorEmail);

      const notaCounts = new Map<string, number>();
      const objecionCounts = new Map<string, number>();
      (allNotas || []).forEach((n: any) =>
        notaCounts.set(n.auditoria_id, (notaCounts.get(n.auditoria_id) || 0) + 1)
      );
      (allObjeciones || []).forEach((o: any) =>
        objecionCounts.set(o.auditoria_id, (objecionCounts.get(o.auditoria_id) || 0) + 1)
      );

      const historial = (auditorias || []).map((a: any) => ({
        id: a.id,
        metadata: a.metadata,
        score: a.score,
        analysis: a.analysis,
        transcription: a.transcription || [],
        notasCount: notaCounts.get(a.id) || 0,
        objecionesCount: objecionCounts.get(a.id) || 0,
      }));

      return res.json({ supervisorEmail, totalAuditorias: historial.length, auditorias: historial });
    } catch (err: any) {
      console.warn("[SUPABASE] Error fetching supervisor history:", err.message);
      return res.json({ supervisorEmail, totalAuditorias: 0, auditorias: [] });
    }
  });
}
