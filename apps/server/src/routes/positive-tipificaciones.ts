import type { Express } from "express";
import { authenticateToken, injectScope } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { insforge } from "../services/insforge.js";
import { localInteractionsMemory, localContactsMemory } from "../config.js";
import type { ServiceScope } from "../types.js";

export default function (app: Express): void {
  app.get(
    "/api/positive-tipificaciones",
    authenticateToken,
    injectScope,
    async (req: AuthenticatedRequest, res) => {
      try {
        const scope = req.scope!;

        const localPositive: any[] = [];
        const seenIds = new Set<string>();

        for (const interaction of localInteractionsMemory) {
          if (interaction.tipificacion !== "positiva") continue;
          const contact = localContactsMemory.find(
            (c: any) => c.id === interaction.contact_id
          );
          if (!contact || !isInScope(contact, scope)) continue;

          seenIds.add(interaction.id);
          localPositive.push({
            id: interaction.id,
            contactId: interaction.contact_id,
            contactName: contact.full_name,
            contactPhone: contact.phone,
            contactEmail: contact.email,
            interactionType: interaction.type,
            notes: interaction.notes,
            created_by_name: interaction.created_by_name,
            created_at: interaction.created_at,
          });
        }

        let dbPositive: any[] = [];
        if (process.env.INSFORGE_BASE_URL) {
          let contactQuery = insforge.database
            .from("contacts")
            .select("id, full_name, phone, email, area_id, team_id, assigned_to");
          contactQuery = buildScopeFilter(contactQuery, scope);
          const { data: scopeContacts } = await contactQuery;
          const scopeContactIds = (scopeContacts || []).map((c: any) => c.id);

          if (scopeContactIds.length > 0) {
            const { data, error } = await insforge.database
              .from("interactions")
              .select("*")
              .eq("tipificacion", "positiva")
              .in("contact_id", scopeContactIds)
              .order("created_at", { ascending: false })
              .limit(50);

            if (!error && data) {
              const contactMap = new Map(
                (scopeContacts || []).map((c: any) => [c.id, c])
              );
              for (const row of data) {
                if (seenIds.has(row.id)) continue;
                const contact = contactMap.get(row.contact_id);
                if (contact) {
                  dbPositive.push({
                    id: row.id,
                    contactId: row.contact_id,
                    contactName: contact.full_name,
                    contactPhone: contact.phone,
                    contactEmail: contact.email,
                    interactionType: row.type,
                    notes: row.notes || null,
                    created_by_name: row.created_by_name || "Usuario",
                    created_at: row.created_at,
                  });
                }
              }
            }
          }
        }

        const merged = [...localPositive, ...dbPositive].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        res.json(merged);
      } catch (err: any) {
        console.error("[POSITIVE_TIPIFICACIONES] Error:", err.message);
        res.status(500).json({ error: err.message });
      }
    }
  );
}

function isInScope(contact: any, scope: ServiceScope): boolean {
  switch (scope.role) {
    case "admin":
      return true;
    case "area_manager":
    case "coordinator":
      return contact.area_id === scope.areaId;
    case "supervisor":
      return contact.team_id === scope.teamId;
    case "agent":
      return contact.assigned_to === scope.userId;
    case "qa":
      return contact.area_id === scope.areaId;
    default:
      return contact.assigned_to === scope.userId;
  }
}

function buildScopeFilter(query: any, scope: ServiceScope) {
  switch (scope.role) {
    case "admin":
      break;
    case "area_manager":
    case "coordinator":
      query = query.eq("area_id", scope.areaId);
      break;
    case "supervisor":
      query = query.eq("team_id", scope.teamId);
      break;
    case "agent":
      query = query.eq("assigned_to", scope.userId);
      break;
    case "qa":
      query = query.eq("area_id", scope.areaId);
      break;
  }
  return query;
}
