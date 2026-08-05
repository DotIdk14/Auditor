import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { History, Search, RotateCcw, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { useAuditLogs, type AuditLogFilters, type AuditLogItem } from "./api";
import type { UserRole } from "@auditor/shared-types";

interface OutletCtx {
  darkMode: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  area_manager: "Gerente",
  coordinator: "Coordinador",
  supervisor: "Supervisor",
  agent: "Asesor",
  qa: "Auditor",
};

const ACTION_LABELS: Record<string, { label: string; cls: string }> = {
  create: { label: "Creación", cls: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/40" },
  update: { label: "Actualización", cls: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/40" },
  delete: { label: "Eliminación", cls: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/40" },
  restore: { label: "Restauración", cls: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800/40" },
  password: { label: "Contraseña", cls: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800/40" },
  login: { label: "Inicio de sesión", cls: "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800/40 dark:text-stone-300 dark:border-stone-700/50" },
  login_failed: { label: "Login fallido", cls: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/40" },
};

const ENTITY_LABELS: Record<string, string> = {
  area: "Área",
  team: "Equipo",
  user: "Usuario",
  auth: "Autenticación",
};

const ALL_ROLES: UserRole[] = ["admin", "area_manager", "coordinator", "supervisor", "agent", "qa"];
const ALL_ACTIONS = Object.keys(ACTION_LABELS);
const ALL_ENTITIES = Object.keys(ENTITY_LABELS);

const cardCls = (dark: boolean) =>
  `rounded-[5px] border-[3px] ${dark ? "bg-[#1c1a18] border-[#3e382f]" : "bg-white border-[#dfd9cc] shadow-[2px_2px_0px_#dfd9cc]"}`;

const inputCls = (dark: boolean) =>
  `w-full border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none transition-all ${
    dark
      ? "bg-[#24211e] border-[#3e382f] text-stone-100 focus:border-[#d4a373]"
      : "bg-[#fcfbf9] border-[#dfd9cc] text-stone-800 focus:border-[#d4a373]"
  }`;

const selectCls = (dark: boolean) =>
  `border rounded-lg px-2 py-1.5 text-[11px] font-bold focus:outline-none transition-all cursor-pointer ${
    dark
      ? "bg-[#24211e] border-[#3e382f] text-stone-200 focus:border-[#d4a373]"
      : "bg-white border-[#dfd9cc] text-stone-700 focus:border-[#d4a373]"
  }`;

const PAGE_SIZE = 50;

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function DetailToggle({ item, darkMode }: { item: AuditLogItem; darkMode: boolean }) {
  const [open, setOpen] = useState(false);
  const hasChanges = item.changes && Object.keys(item.changes).length > 0;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        disabled={!hasChanges}
        className={`text-[10px] font-black uppercase tracking-wider cursor-pointer disabled:cursor-default ${
          hasChanges ? (darkMode ? "text-[#d4a373] hover:text-amber-300" : "text-[#b57b54] hover:text-[#a36d49]") : "opacity-30"
        }`}
      >
        {open ? "Ocultar detalle" : "Ver detalle"}
      </button>
      {open && (
        <pre className={`mt-1.5 rounded-md p-2 text-[9.5px] leading-relaxed overflow-x-auto max-w-[360px] font-mono ${
          darkMode ? "bg-[#161412] text-stone-400 border border-[#3e382f]" : "bg-stone-50 text-stone-600 border border-[#e6e0d0]"
        }`}>
          {JSON.stringify(item.changes, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AuditLogPage() {
  const { darkMode } = useOutletContext<OutletCtx>();

  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [offset, setOffset] = useState(0);

  const filters: AuditLogFilters = useMemo(() => {
    const f: AuditLogFilters = { limit: PAGE_SIZE, offset };
    if (role) f.role = role as UserRole;
    if (action) f.action = action;
    if (entityType) f.entityType = entityType;
    if (q.trim()) f.q = q.trim();
    if (from) f.from = `${from}T00:00:00`;
    if (to) f.to = `${to}T23:59:59`;
    return f;
  }, [q, role, action, entityType, from, to, offset]);

  const { data, isLoading, isError, refetch } = useAuditLogs(filters);

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + PAGE_SIZE, total);
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  const clearFilters = () => {
    setQ(""); setRole(""); setAction(""); setEntityType(""); setFrom(""); setTo("");
    setOffset(0);
  };

  const hasFilters = q || role || action || entityType || from || to;

  return (
    <div className="p-6 pb-28 overflow-y-auto h-full w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h1 className={`text-lg font-black font-display ${darkMode ? "text-[#f4f1eb]" : "text-stone-800"}`}>
            Historial
          </h1>
          <p className={`text-xs font-semibold ${darkMode ? "text-stone-500" : "text-stone-500"}`}>
            Registro de cambios, accesos y actividad. Cada rol ve su alcance.
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black ${
          darkMode ? "border-[#3e382f] text-stone-300" : "border-[#dfd9cc] text-stone-600"
        }`}>
          <History className="w-3.5 h-3.5" /> {total} eventos
        </span>
      </div>

      {/* Filters */}
      <div className={`${cardCls(darkMode)} p-4 mb-5`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className={`absolute left-3 top-2.5 w-4 h-4 ${darkMode ? "text-stone-500" : "text-stone-400"}`} />
            <input
              type="text"
              placeholder="Buscar por correo, actor o entidad…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setOffset(0); }}
              className={inputCls(darkMode) + " pl-9"}
            />
          </div>
          <select className={selectCls(darkMode)} value={role} onChange={(e) => { setRole(e.target.value); setOffset(0); }}>
            <option value="">Todos los roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <select className={selectCls(darkMode)} value={action} onChange={(e) => { setAction(e.target.value); setOffset(0); }}>
            <option value="">Toda acción</option>
            {ALL_ACTIONS.map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a].label}</option>
            ))}
          </select>
          <select className={selectCls(darkMode)} value={entityType} onChange={(e) => { setEntityType(e.target.value); setOffset(0); }}>
            <option value="">Toda entidad</option>
            {ALL_ENTITIES.map((en) => (
              <option key={en} value={en}>{ENTITY_LABELS[en]}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setOffset(0); }} className={selectCls(darkMode)} />
            <span className={`text-[10px] font-black ${darkMode ? "text-stone-500" : "text-stone-400"}`}>a</span>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setOffset(0); }} className={selectCls(darkMode)} />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                darkMode ? "border-[#3e382f] text-stone-300" : "border-[#dfd9cc] text-stone-600"
              }`}
            >
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {isError && (
        <div className={`${cardCls(darkMode)} p-6 mb-5 flex items-center justify-between`}>
          <p className="text-xs font-bold text-red-500">No se pudo cargar el historial.</p>
          <button onClick={() => refetch()} className={`px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer ${darkMode ? "border-[#3e382f] text-stone-300" : "border-[#dfd9cc] text-stone-600"}`}>
            Reintentar
          </button>
        </div>
      )}

      {/* Table */}
      <div className={`overflow-x-auto ${cardCls(darkMode)}`}>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className={`border-b-[3px] ${darkMode ? "border-[#3e382f] text-stone-400" : "border-[#dfd9cc] text-stone-500"}`}>
              {["Fecha", "Actor", "Acción", "Entidad", "Detalle", "Área / Equipo"].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8">
                  <div className="h-4 w-full rounded animate-pulse bg-stone-200 dark:bg-[#24211e]" />
                </td>
              </tr>
            )}
            {!isLoading && items.map((item) => (
              <tr key={item.id} className={`border-b ${darkMode ? "border-[#2a2622]" : "border-[#f0ecdf]"}`}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-[10.5px] font-bold ${darkMode ? "text-stone-300" : "text-stone-700"}`}>
                    {formatDate(item.createdAt)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="min-w-0">
                    <p className={`truncate font-bold ${darkMode ? "text-stone-200" : "text-stone-800"}`}>
                      {item.actorEmail || item.actorId || "—"}
                    </p>
                    {item.actorRole && (
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full border text-[8.5px] font-black uppercase tracking-wider ${
                        darkMode ? "bg-[#24211e] border-[#3e382f] text-stone-300" : "bg-stone-50 border-[#e0dacb] text-stone-600"
                      }`}>
                        {ROLE_LABELS[item.actorRole] ?? item.actorRole}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${ACTION_LABELS[item.action]?.cls ?? ""}`}>
                    {ACTION_LABELS[item.action]?.label ?? item.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="min-w-0">
                    <p className={`truncate font-bold max-w-[180px] ${darkMode ? "text-stone-200" : "text-stone-800"}`}>
                      {item.entityLabel || item.entityId || "—"}
                    </p>
                    <p className={`text-[9px] font-black uppercase tracking-wider ${darkMode ? "text-stone-500" : "text-stone-400"}`}>
                      {ENTITY_LABELS[item.entityType] ?? item.entityType}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <DetailToggle item={item} darkMode={darkMode} />
                </td>
                <td className="px-4 py-3">
                  {item.areaId || item.teamId ? (
                    <div className="flex flex-col gap-0.5">
                      {item.areaId && (
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
                          <Filter className="w-2.5 h-2.5" /> {item.areaId.slice(0, 8)}
                        </span>
                      )}
                      {item.teamId && (
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
                          <RotateCcw className="w-2.5 h-2.5" /> {item.teamId.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className={`text-[10px] font-semibold ${darkMode ? "text-stone-600" : "text-stone-400"}`}>—</span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={6} className={`px-4 py-12 text-center text-[11px] font-black uppercase tracking-widest opacity-40 ${darkMode ? "text-stone-300" : "text-stone-600"}`}>
                  No hay eventos que coincidan con los filtros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className={`mt-4 flex items-center justify-between ${cardCls(darkMode)} px-4 py-3`}>
          <p className={`text-[11px] font-bold ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            Mostrando {pageStart}–{pageEnd} de {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              disabled={!hasPrev}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                darkMode ? "border-[#3e382f] text-stone-200" : "border-[#dfd9cc] text-stone-700"
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>
            <button
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
              disabled={!hasNext}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                darkMode ? "border-[#3e382f] text-stone-200" : "border-[#dfd9cc] text-stone-700"
              }`}
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
