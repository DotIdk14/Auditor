import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import {
  Plus, Search, Users as UsersIcon, ShieldCheck, Building2, X, UserCog, KeyRound, UserPlus,
  Trash2, RotateCcw, ArchiveRestore
} from "lucide-react";
import { useAuthStore } from "../../auth/authStore";
import {
  useOrgUsers, useOrgStructure, useUpdateUser, useCreateTeam, useCreateUser, useCreateArea,
  useSoftDeleteUser, useRestoreUser, useDeletedUsers,
  type OrgUser, type OrgTeam, type OrgArea, type UserUpdatePayload, type CreateUserPayload,
} from "./api";
import type { UserRole } from "@auditor/shared-types";

export const MANAGER_ROLES: UserRole[] = ["admin", "area_manager", "coordinator"];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  area_manager: "Gerente",
  coordinator: "Coordinador",
  supervisor: "Supervisor",
  agent: "Asesor",
  qa: "Auditor",
};

const ASSIGNABLE_ROLES: Record<UserRole, UserRole[]> = {
  admin: ["admin", "area_manager", "coordinator", "supervisor", "agent", "qa"],
  area_manager: ["coordinator", "supervisor", "agent", "qa"],
  coordinator: ["agent", "qa"],
  supervisor: [],
  agent: [],
  qa: [],
};

interface OutletCtx {
  searchQuery: string;
  darkMode: boolean;
  openNotesPanel: () => void;
}

function initials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// ── Theme helpers ───────────────────────────────────────────────────────────

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

// ── New team dialog ─────────────────────────────────────────────────────────

function NewTeamDialog({
  open, onClose, darkMode,
}: { open: boolean; onClose: () => void; darkMode: boolean }) {
  const me = useAuthStore((s) => s.user);
  const { data: org } = useOrgStructure(open);
  const { data: users } = useOrgUsers(open);
  const createTeam = useCreateTeam();

  const [name, setName] = useState("");
  const [areaId, setAreaId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [coordinatorId, setCoordinatorId] = useState("");

  if (!open) return null;

  const isAdmin = me?.role === "admin";
  const isAreaManager = me?.role === "area_manager";
  const supervisorOptions = (users ?? []).filter((u) => u.role === "supervisor");
  const coordinatorOptions = (users ?? []).filter((u) => u.role === "coordinator");
  const areas: OrgArea[] = org?.areas ?? [];

  const canSubmit =
    name.trim().length > 0 &&
    (me?.role === "coordinator" || areaId.length > 0);

  const handleCreate = () => {
    createTeam.mutate(
      {
        name: name.trim(),
        areaId: me?.role === "coordinator" ? (me?.areaId ?? "") : areaId,
        supervisorId: supervisorId || null,
        coordinatorId: isAdmin || isAreaManager ? coordinatorId || null : null,
      },
      {
        onSuccess: () => {
          setName("");
          setAreaId("");
          setSupervisorId("");
          setCoordinatorId("");
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md ${cardCls(darkMode)} p-6 space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-base font-black font-display ${darkMode ? "text-[#f4f1eb]" : "text-stone-800"}`}>
            Nuevo equipo
          </h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg hover:bg-black/5 ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className={`text-[11px] font-semibold ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
          Crea un equipo y asígnalo a un supervisor y coordinador.
        </p>

        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            Nombre del equipo
          </label>
          <input
            className={inputCls(darkMode)}
            placeholder="Ej. Equipo Ventas Norte"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {(isAdmin || isAreaManager) && (
          <div className="space-y-1.5">
            <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
              Área
            </label>
            <select className={selectCls(darkMode)} value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              <option value="">Selecciona un área</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            Supervisor (lidera el equipo)
          </label>
          <select className={selectCls(darkMode)} value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
            <option value="">Sin supervisor asignado</option>
            {supervisorOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.fullName || s.email}</option>
            ))}
          </select>
        </div>

        {(isAdmin || isAreaManager) && (
          <div className="space-y-1.5">
            <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
              Coordinador (responsable del grupo)
            </label>
            <select className={selectCls(darkMode)} value={coordinatorId} onChange={(e) => setCoordinatorId(e.target.value)}>
              <option value="">Selecciona un coordinador</option>
              {coordinatorOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.fullName || c.email}</option>
              ))}
            </select>
          </div>
        )}

        {createTeam.isError && (
          <p className="text-[11px] font-bold text-red-500">
            {(createTeam.error as any)?.message || "No se pudo crear el equipo"}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
              darkMode ? "border-[#3e382f] text-stone-300" : "border-[#dfd9cc] text-stone-600"
            }`}
          >
            Cancelar
          </button>
          <button
            disabled={!canSubmit || createTeam.isPending}
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg text-xs font-black bg-[#b57b54] text-white hover:bg-[#a36d49] disabled:opacity-50 cursor-pointer"
          >
            {createTeam.isPending ? "Creando…" : "Crear equipo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New area (coordinación) dialog ──────────────────────────────────────────

function NewAreaDialog({
  open, onClose, darkMode,
}: { open: boolean; onClose: () => void; darkMode: boolean }) {
  const { data: users } = useOrgUsers(open);
  const createArea = useCreateArea();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");

  if (!open) return null;

  const managerOptions = (users ?? []).filter((u) => u.role === "area_manager" || u.role === "admin");

  const handleCreate = () => {
    createArea.mutate(
      {
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        managerId: managerId || null,
      },
      {
        onSuccess: () => {
          setName("");
          setCode("");
          setDescription("");
          setManagerId("");
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md ${cardCls(darkMode)} p-6 space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-base font-black font-display ${darkMode ? "text-[#f4f1eb]" : "text-stone-800"}`}>
            Nueva coordinación
          </h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg hover:bg-black/5 ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className={`text-[11px] font-semibold ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
          Crea un área de coordinación (ej. Ventas Norte, Retención).
        </p>

        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            Nombre del área *
          </label>
          <input className={inputCls(darkMode)} placeholder="Ej. Coordinación Ventas Norte" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            Código (opcional)
          </label>
          <input className={inputCls(darkMode)} placeholder="Ej. VENTAS_NORTE (auto si se deja vacío)" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            Descripción (opcional)
          </label>
          <input className={inputCls(darkMode)} placeholder="Descripción breve" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            Gerente responsable (opcional)
          </label>
          <select className={selectCls(darkMode)} value={managerId} onChange={(e) => setManagerId(e.target.value)}>
            <option value="">Sin gerente asignado</option>
            {managerOptions.map((m) => (
              <option key={m.id} value={m.id}>{m.fullName || m.email}</option>
            ))}
          </select>
        </div>

        {createArea.isError && (
          <p className="text-[11px] font-bold text-red-500">
            {(createArea.error as any)?.message || "No se pudo crear el área"}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-xs font-bold border cursor-pointer ${darkMode ? "border-[#3e382f] text-stone-300" : "border-[#dfd9cc] text-stone-600"}`}>
            Cancelar
          </button>
          <button
            disabled={!name.trim() || createArea.isPending}
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg text-xs font-black bg-[#b57b54] text-white hover:bg-[#a36d49] disabled:opacity-50 cursor-pointer"
          >
            {createArea.isPending ? "Creando…" : "Crear área"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New user dialog ─────────────────────────────────────────────────────────

function NewUserDialog({
  open, onClose, darkMode,
}: { open: boolean; onClose: () => void; darkMode: boolean }) {
  const me = useAuthStore((s) => s.user);
  const { data: org } = useOrgStructure(open);
  const { data: users = [] } = useOrgUsers(open);
  const createUser = useCreateUser();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("agent");
  const [areaId, setAreaId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [password, setPassword] = useState("");

  const isCoordinator = me?.role === "coordinator";
  const availableTeams = useMemo(() => {
    const all = org?.teams ?? [];
    if (isCoordinator) return all.filter((t) => t.coordinatorId === me?.sub);
    if (!areaId) return [];
    return all.filter((t) => t.areaId === areaId);
  }, [org, isCoordinator, me, areaId]);

  if (!open) return null;

  const isAdmin = me?.role === "admin";
  const isAreaManager = me?.role === "area_manager";

  const assignable = me ? ASSIGNABLE_ROLES[me.role] ?? [] : [];
  const areas: OrgArea[] = isAdmin
    ? org?.areas ?? []
    : isAreaManager
      ? (org?.areas ?? []).filter((a) => a.id === me?.areaId)
      : [];

  const canSubmit = email.trim().includes("@") && role.length > 0 && fullName.trim().length > 0;

  const handleCreate = () => {
    const payload: CreateUserPayload = {
      email: email.trim(),
      fullName: fullName.trim(),
      role,
      password: password.trim() || undefined,
      isActive: true,
    };
    if (isCoordinator) {
      payload.areaId = me?.areaId ?? null;
      payload.teamId = teamId || null;
    } else {
      payload.areaId = areaId || null;
      payload.teamId = teamId || null;
    }
    createUser.mutate(payload, {
      onSuccess: () => {
        setFullName("");
        setEmail("");
        setRole("agent");
        setAreaId("");
        setTeamId("");
        setPassword("");
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md ${cardCls(darkMode)} p-6 space-y-4 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-base font-black font-display ${darkMode ? "text-[#f4f1eb]" : "text-stone-800"}`}>
            Nuevo usuario
          </h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg hover:bg-black/5 ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className={`text-[11px] font-semibold ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
          El usuario podrá entrar con correo + contraseña o vincular Google (mismo correo).
        </p>

        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            Nombre completo *
          </label>
          <input className={inputCls(darkMode)} placeholder="Ej. Ana Martínez" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            Correo electrónico *
          </label>
          <input className={inputCls(darkMode)} placeholder="usuario@correo.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            Rol *
          </label>
          <select className={selectCls(darkMode)} value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {assignable.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>

        {!isCoordinator && areas.length > 0 && (
          <div className="space-y-1.5">
            <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
              Área
            </label>
            <select className={selectCls(darkMode)} value={areaId} onChange={(e) => { setAreaId(e.target.value); setTeamId(""); }}>
              <option value="">Sin área</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}

        {!isCoordinator && availableTeams.length > 0 && (
          <div className="space-y-1.5">
            <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
              Equipo
            </label>
            <select className={selectCls(darkMode)} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">Sin equipo</option>
              {availableTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {isCoordinator && availableTeams.length > 0 && (
          <div className="space-y-1.5">
            <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
              Equipo (tus equipos)
            </label>
            <select className={selectCls(darkMode)} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">Sin equipo</option>
              {availableTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            Contraseña inicial (opcional)
          </label>
          <input className={inputCls(darkMode)} placeholder="Mínimo 6 caracteres" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className={`text-[10px] font-semibold ${darkMode ? "text-stone-500" : "text-stone-400"}`}>
            Si se deja vacía, el acceso queda abierto por correo (como hoy).
          </p>
        </div>

        {createUser.isError && (
          <p className="text-[11px] font-bold text-red-500">
            {(createUser.error as any)?.message || "No se pudo crear el usuario"}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-xs font-bold border cursor-pointer ${darkMode ? "border-[#3e382f] text-stone-300" : "border-[#dfd9cc] text-stone-600"}`}>
            Cancelar
          </button>
          <button
            disabled={!canSubmit || createUser.isPending}
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg text-xs font-black bg-[#b57b54] text-white hover:bg-[#a36d49] disabled:opacity-50 cursor-pointer"
          >
            {createUser.isPending ? "Creando…" : "Crear usuario"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Password dialog ─────────────────────────────────────────────────────────

function PasswordDialog({
  user, onClose, darkMode,
}: { user: OrgUser | null; onClose: () => void; darkMode: boolean }) {
  const updateUser = useUpdateUser();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  if (!user) return null;

  const canSubmit = password.length >= 6 && password === confirm;

  const handleSave = () => {
    updateUser.mutate(
      { id: user.id, patch: { password } },
      { onSuccess: () => { setPassword(""); setConfirm(""); onClose(); } }
    );
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-sm ${cardCls(darkMode)} p-6 space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-base font-black font-display ${darkMode ? "text-[#f4f1eb]" : "text-stone-800"}`}>
            Contraseña de acceso
          </h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg hover:bg-black/5 ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className={`text-[11px] font-semibold ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
          Usuario: <span className="font-black text-stone-600 dark:text-stone-200">{user.fullName || user.email}</span>
        </p>
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            Nueva contraseña
          </label>
          <input className={inputCls(darkMode)} placeholder="Mínimo 6 caracteres" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
            Confirmar contraseña
          </label>
          <input className={inputCls(darkMode)} placeholder="Repite la contraseña" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {confirm.length > 0 && password !== confirm && (
            <p className="text-[10px] font-bold text-red-500">Las contraseñas no coinciden</p>
          )}
        </div>
        {updateUser.isError && (
          <p className="text-[11px] font-bold text-red-500">
            {(updateUser.error as any)?.message || "No se pudo guardar la contraseña"}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-xs font-bold border cursor-pointer ${darkMode ? "border-[#3e382f] text-stone-300" : "border-[#dfd9cc] text-stone-600"}`}>
            Cancelar
          </button>
          <button
            disabled={!canSubmit || updateUser.isPending}
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-black bg-[#b57b54] text-white hover:bg-[#a36d49] disabled:opacity-50 cursor-pointer"
          >
            {updateUser.isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Structure tab (tree) ────────────────────────────────────────────────────

function StructureTree({ org, users, darkMode }: { org: any; users: OrgUser[]; darkMode: boolean }) {
  const areas: OrgArea[] = org?.areas ?? [];
  const teams: OrgTeam[] = org?.teams ?? [];
  const none = areas.length === 0;

  return (
    <div className="space-y-4">
      {none && (
        <div className={`py-12 text-center text-xs font-black uppercase tracking-widest opacity-40 ${darkMode ? "text-stone-300" : "text-stone-600"}`}>
          No hay áreas ni equipos configurados todavía
        </div>
      )}
      {areas.map((area) => {
        const areaTeams = teams.filter((t) => t.areaId === area.id);
        return (
          <div key={area.id} className={cardCls(darkMode)}>
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b-[3px] border-[#dfd9cc] dark:border-[#3e382f]">
              <Building2 className={`w-4 h-4 ${darkMode ? "text-[#d4a373]" : "text-[#b57b54]"}`} />
              <div>
                <p className={`text-sm font-black font-display ${darkMode ? "text-[#f4f1eb]" : "text-stone-800"}`}>{area.name}</p>
                <p className={`text-[10px] font-bold ${darkMode ? "text-stone-500" : "text-stone-500"}`}>
                  {areaTeams.length} {areaTeams.length === 1 ? "equipo" : "equipos"}
                </p>
              </div>
            </div>
            <div className="p-4 grid gap-3 md:grid-cols-2">
              {areaTeams.length === 0 && (
                <div className={`col-span-full rounded-[5px] border border-dashed px-4 py-6 text-center ${darkMode ? "border-[#3e382f]" : "border-[#dfd9cc]"}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-stone-500" : "text-stone-400"}`}>
                    Sin equipos todavía — usa «Nuevo equipo» para asignar uno
                  </p>
                </div>
              )}
              {areaTeams.map((team) => {
                const members = users.filter((u) => u.teamId === team.id);
                return (
                  <div key={team.id} className={`rounded-[5px] border p-3.5 ${darkMode ? "bg-[#161412] border-[#3e382f]" : "bg-[#fcfbf9] border-[#e6e0d0]"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-black ${darkMode ? "text-stone-200" : "text-stone-800"}`}>{team.name}</p>
                      <span className={`text-[9px] font-black uppercase tracking-wider border px-2 py-0.5 rounded-full ${darkMode ? "text-[#ffd8b3] bg-[#3e342a]/40 border-[#d4a373]/20" : "text-[#b57b54] bg-[#faedcd]/40 border-[#d4a373]/30"}`}>
                        {members.length} {members.length === 1 ? "miembro" : "miembros"}
                      </span>
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] font-semibold">
                      <div className={darkMode ? "text-stone-400" : "text-stone-500"}>
                        <p className="font-black uppercase tracking-wider">Coordinador</p>
                        <p className="text-stone-600 dark:text-stone-300">{team.coordinatorName || "—"}</p>
                      </div>
                      <div className={darkMode ? "text-stone-400" : "text-stone-500"}>
                        <p className="font-black uppercase tracking-wider">Supervisor</p>
                        <p className="text-stone-600 dark:text-stone-300">{team.supervisorName || "—"}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {members.map((m) => (
                        <span key={m.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${
                          darkMode ? "bg-[#24211e] border-[#3e382f] text-stone-300" : "bg-stone-50 border-[#e0dacb] text-stone-600"
                        }`}>
                          <UsersIcon className="w-3 h-3" />
                          {m.fullName || m.email}
                        </span>
                      ))}
                      {members.length === 0 && (
                        <span className={`text-[10px] font-semibold ${darkMode ? "text-stone-500" : "text-stone-400"}`}>
                          Sin asesores asignados
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Users table ─────────────────────────────────────────────────────────────

function UsersTable({ darkMode }: { darkMode: boolean }) {
  const me = useAuthStore((s) => s.user);
  const { data: users = [], isLoading, isError, refetch } = useOrgUsers();
  const { data: org } = useOrgStructure();
  const updateUser = useUpdateUser();
  const deleteUser = useSoftDeleteUser();
  const restoreUser = useRestoreUser();
  const { data: deletedUsers = [] } = useDeletedUsers(me?.role === "admin");
  const [search, setSearch] = useState("");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<OrgUser | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const canEdit = me ? MANAGER_ROLES.includes(me.role) : false;
  const assignable = me ? ASSIGNABLE_ROLES[me.role] ?? [] : [];

  const myTeams = useMemo(() => {
    if (me?.role !== "coordinator") return null;
    return (org?.teams ?? []).filter((t) => t.coordinatorId === me.sub);
  }, [org, me]);

  const handlePatch = (user: OrgUser, patch: UserUpdatePayload) => {
    if (!canEdit || user.id === me?.sub) return;
    updateUser.mutate({ id: user.id, patch });
  };

  const handleDelete = (user: OrgUser) => {
    if (!canEdit || user.id === me?.sub) return;
    const name = user.fullName || user.email;
    if (!window.confirm(`¿Eliminar a "${name}"? El usuario quedará desactivado y podrás restaurarlo después.`)) return;
    deleteUser.mutate(user.id);
  };

  const handleRestore = (user: OrgUser) => {
    const name = user.fullName || user.email;
    if (!window.confirm(`¿Restaurar a "${name}"? Volverá a estar activo con su rol y equipo.`)) return;
    restoreUser.mutate(user.id);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.fullName ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.teamName ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const teamsFor = (u: OrgUser) => (myTeams ?? org?.teams ?? []).filter((t) => t.areaId === u.areaId || !u.areaId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className={`absolute left-3 top-2.5 w-4 h-4 ${darkMode ? "text-stone-500" : "text-stone-400"}`} />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o equipo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputCls(darkMode) + " pl-9"}
          />
        </div>
        {isError && (
          <button onClick={() => refetch()} className={`px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer ${darkMode ? "border-[#3e382f] text-stone-300" : "border-[#dfd9cc] text-stone-600"}`}>
            Reintentar
          </button>
        )}
        {canEdit && (
          <button
            onClick={() => setUserDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black bg-[#b57b54] text-white hover:bg-[#a36d49] cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> Nuevo usuario
          </button>
        )}
        {me?.role === "admin" && (
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black border cursor-pointer ${
              showDeleted
                ? "bg-[#b57b54] text-white border-[#b57b54]"
                : darkMode ? "border-[#3e382f] text-stone-300" : "border-[#dfd9cc] text-stone-600"
            }`}
          >
            <ArchiveRestore className="w-3.5 h-3.5" /> Eliminados{deletedUsers.length > 0 && ` (${deletedUsers.length})`}
          </button>
        )}
      </div>

      <div className={`overflow-x-auto ${cardCls(darkMode)}`}>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className={`border-b-[3px] ${darkMode ? "border-[#3e382f] text-stone-400" : "border-[#dfd9cc] text-stone-500"}`}>
              {["Nombre", "Rol", "Equipo", "Supervisor", "Coordinador", "Activo"].map((h) => (
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
            {!isLoading && filtered.map((u) => {
              const isMe = u.id === me?.sub;
              const editable = canEdit && !isMe;
              return (
                <tr key={u.id} className={`border-b ${darkMode ? "border-[#2a2622]" : "border-[#f0ecdf]"}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${darkMode ? "border-[#3e382f] bg-[#24211e]" : "border-[#dfd9cc] bg-white"}`}>
                        <span className="text-[#b57b54] font-black text-[10px]">{initials(u.fullName, u.email)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className={`truncate font-bold ${darkMode ? "text-stone-200" : "text-stone-800"}`}>
                          {u.fullName || "—"}{isMe && <span className={`ml-2 text-[10px] font-semibold ${darkMode ? "text-stone-500" : "text-stone-400"}`}>(tú)</span>}
                        </p>
                        <p className={`truncate text-[10px] font-semibold ${darkMode ? "text-stone-500" : "text-stone-400"}`}>{u.email}</p>
                        <span className={`inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider ${
                          u.hasPassword
                            ? darkMode ? "text-[#d4a373]" : "text-[#b57b54]"
                            : darkMode ? "text-stone-600" : "text-stone-400"
                        }`}>
                          <KeyRound className="w-2.5 h-2.5" /> {u.hasPassword ? "con contraseña" : "sin contraseña"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editable && assignable.length > 0 ? (
                      <select
                        className={selectCls(darkMode)}
                        value={u.role}
                        onChange={(e) => handlePatch(u, { role: e.target.value as UserRole })}
                      >
                        {assignable.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                        darkMode ? "bg-[#24211e] border-[#3e382f] text-stone-300" : "bg-stone-50 border-[#e0dacb] text-stone-600"
                      }`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editable ? (
                      <select
                        className={selectCls(darkMode)}
                        value={u.teamId ?? "none"}
                        onChange={(e) => handlePatch(u, { teamId: e.target.value === "none" ? null : e.target.value })}
                      >
                        <option value="none">Sin equipo</option>
                        {teamsFor(u).map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={darkMode ? "text-stone-400" : "text-stone-500"}>{u.teamName || "—"}</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 ${darkMode ? "text-stone-400" : "text-stone-500"}`}>{u.supervisorName || "—"}</td>
                  <td className={`px-4 py-3 ${darkMode ? "text-stone-400" : "text-stone-500"}`}>{u.coordinatorName || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {editable && me?.role === "admin" && (
                        <button
                          onClick={() => setPasswordUser(u)}
                          className={`p-1.5 rounded-lg border cursor-pointer ${darkMode ? "border-[#3e382f] text-[#d4a373] hover:bg-[#2e2a24]" : "border-[#dfd9cc] text-[#b57b54] hover:bg-[#faedcd]/40"}`}
                          title="Fijar/restablecer contraseña"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {editable && me?.role === "admin" && (
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={deleteUser.isPending}
                          className={`p-1.5 rounded-lg border cursor-pointer disabled:opacity-40 ${darkMode ? "border-[#3e382f] text-red-400 hover:bg-red-950/30" : "border-[#dfd9cc] text-red-500 hover:bg-red-50"}`}
                          title="Eliminar usuario (recuperable)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        disabled={!editable}
                        onClick={() => handlePatch(u, { isActive: !u.isActive })}
                        className={`w-9 h-5 rounded-full p-0.5 transition-all cursor-pointer ${editable ? "" : "opacity-40 cursor-not-allowed"} ${
                          u.isActive ? "bg-[#b57b54]" : darkMode ? "bg-[#3e382f]" : "bg-[#dfd9cc]"
                        }`}
                        title={u.isActive ? "Desactivar" : "Activar"}
                      >
                        <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-all ${u.isActive ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className={`px-4 py-10 text-center text-[11px] font-black uppercase tracking-widest opacity-40 ${darkMode ? "text-stone-300" : "text-stone-600"}`}>
                  No hay usuarios que coincidan con la búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showDeleted && (
        <div className={`${cardCls(darkMode)} mt-5`}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b-[3px] border-[#dfd9cc] dark:border-[#3e382f]">
            <div className="flex items-center gap-2.5">
              <ArchiveRestore className={`w-4 h-4 ${darkMode ? "text-[#d4a373]" : "text-[#b57b54]"}`} />
              <div>
                <p className={`text-sm font-black font-display ${darkMode ? "text-[#f4f1eb]" : "text-stone-800"}`}>
                  Usuarios eliminados
                </p>
                <p className={`text-[10px] font-bold ${darkMode ? "text-stone-500" : "text-stone-500"}`}>
                  {deletedUsers.length === 0 ? "Ninguno por ahora" : `Se pueden restaurar en cualquier momento (${deletedUsers.length})`}
                </p>
              </div>
            </div>
            <button onClick={() => setShowDeleted(false)} className={`p-1.5 rounded-lg hover:bg-black/5 cursor-pointer ${darkMode ? "text-stone-400" : "text-stone-500"}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
          {deletedUsers.length === 0 ? (
            <div className={`px-5 py-10 text-center text-[11px] font-black uppercase tracking-widest opacity-40 ${darkMode ? "text-stone-300" : "text-stone-600"}`}>
              No hay usuarios eliminados
            </div>
          ) : (
            <ul className="divide-y divide-[#dfd9cc] dark:divide-[#2a2622]">
              {deletedUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${darkMode ? "border-[#3e382f] bg-[#24211e]" : "border-[#dfd9cc] bg-white"}`}>
                      <span className="text-[#b57b54] font-black text-[10px]">{initials(u.fullName, u.email)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate font-bold ${darkMode ? "text-stone-200" : "text-stone-800"}`}>
                        {u.fullName || "—"}
                      </p>
                      <p className={`truncate text-[10px] font-semibold ${darkMode ? "text-stone-500" : "text-stone-400"}`}>
                        {u.email} · {ROLE_LABELS[u.role] ?? u.role}
                      </p>
                      {u.deletedAt && (
                        <p className={`text-[9px] font-bold ${darkMode ? "text-stone-600" : "text-stone-400"}`}>
                          Eliminado {new Date(u.deletedAt).toLocaleString("es-MX")}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(u)}
                    disabled={restoreUser.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black bg-[#b57b54] text-white hover:bg-[#a36d49] disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <NewUserDialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} darkMode={darkMode} />
      <PasswordDialog user={passwordUser} onClose={() => setPasswordUser(null)} darkMode={darkMode} />
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function EquiposPage() {
  const { darkMode } = useOutletContext<OutletCtx>();
  const me = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [tab, setTab] = useState<"equipos" | "usuarios">("equipos");
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);

  const isManager = me ? MANAGER_ROLES.includes(me.role) : false;
  const isAdmin = me?.role === "admin";
  const { data: org, isLoading } = useOrgStructure(isManager);
  const { data: users = [] } = useOrgUsers(isManager);

  if (!isManager) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className={`text-center space-y-2 ${cardCls(darkMode)} px-10 py-8`}>
          <UserCog className={`w-8 h-8 mx-auto ${darkMode ? "text-stone-500" : "text-stone-400"}`} />
          <p className={`text-sm font-black ${darkMode ? "text-stone-200" : "text-stone-800"}`}>Sin acceso</p>
          <p className={`text-xs font-semibold ${darkMode ? "text-stone-500" : "text-stone-400"}`}>
            La gestión de equipos y roles es exclusiva para admin, gerente o coordinador.
          </p>
          <button onClick={() => navigate("/")} className="mt-3 px-4 py-2 rounded-lg text-xs font-black bg-[#b57b54] text-white cursor-pointer">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-28 overflow-y-auto h-full w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h1 className={`text-lg font-black font-display ${darkMode ? "text-[#f4f1eb]" : "text-stone-800"}`}>
            Equipos y roles
          </h1>
          <p className={`text-xs font-semibold ${darkMode ? "text-stone-500" : "text-stone-500"}`}>
            Coordinadores → supervisores → asesores. Asigna roles y organiza equipos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setAreaDialogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black border bg-white dark:bg-[#24211e] text-[#b57b54] border-[#d4a373]/40 hover:bg-[#faedcd]/40 dark:hover:bg-[#3e342a]/40 cursor-pointer"
            >
              <Building2 className="w-4 h-4" /> Nueva área
            </button>
          )}
          <button
            onClick={() => setTeamDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black bg-[#b57b54] text-white hover:bg-[#a36d49] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuevo equipo
          </button>
        </div>
      </div>

      <div className={`inline-flex p-1.5 rounded-2xl mb-5 ${darkMode ? "bg-[#1c1a18] border border-[#3e382f]" : "bg-stone-50 border border-stone-200 shadow-sm"}`}>
        {(["equipos", "usuarios"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === t
                ? darkMode ? "bg-amber-900/40 text-amber-500 shadow-inner" : "bg-white text-[#b57b54] shadow-md border border-[#dfd9cc]"
                : darkMode ? "text-stone-500 hover:text-stone-300" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            {t === "equipos" ? "Equipos" : "Usuarios"}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className={`h-40 w-full rounded-[5px] animate-pulse ${darkMode ? "bg-[#1c1a18]" : "bg-white"}`} />
      )}

      {!isLoading && tab === "equipos" && (
        <StructureTree org={org} users={users} darkMode={darkMode} />
      )}

      {!isLoading && tab === "usuarios" && <UsersTable darkMode={darkMode} />}

      <NewAreaDialog open={areaDialogOpen} onClose={() => setAreaDialogOpen(false)} darkMode={darkMode} />
      <NewTeamDialog open={teamDialogOpen} onClose={() => setTeamDialogOpen(false)} darkMode={darkMode} />
    </div>
  );
}
