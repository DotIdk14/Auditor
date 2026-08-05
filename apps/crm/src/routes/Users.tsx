"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Users as UsersIcon, ShieldCheck } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import {
  listUsers,
  getOrgStructure,
  updateUser,
  createTeam,
  type UserUpdatePayload,
} from "@/api/users";
import type { OrgTeam, OrgUser, UserRole } from "@/api/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  area_manager: "Gerente",
  coordinator: "Coordinador",
  supervisor: "Supervisor",
  agent: "Asesor",
  qa: "Auditor",
};

// Roles the caller is allowed to assign
const ASSIGNABLE_ROLES: Record<UserRole, UserRole[]> = {
  admin: ["admin", "area_manager", "coordinator", "supervisor", "agent", "qa"],
  area_manager: ["coordinator", "supervisor", "agent", "qa"],
  coordinator: ["agent", "qa"],
  supervisor: [],
  agent: [],
  qa: [],
};

function initials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Team creation dialog ──────────────────────────────────────────────────

function NewTeamDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { data: org } = useQuery({
    queryKey: ["org-structure"],
    queryFn: getOrgStructure,
    enabled: open,
  });
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    enabled: open,
  });

  const [name, setName] = useState("");
  const [areaId, setAreaId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [coordinatorId, setCoordinatorId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";
  const isAreaManager = user?.role === "area_manager";
  const supervisorOptions = (users ?? []).filter((u) => u.role === "supervisor");
  const coordinatorOptions = (users ?? []).filter((u) => u.role === "coordinator");

  const mutation = useMutation({
    mutationFn: () =>
      createTeam({
        name,
        areaId:
          user?.role === "coordinator" ? (user?.areaId ?? "") : areaId,
        supervisorId: supervisorId || null,
        coordinatorId:
          isAdmin || isAreaManager ? coordinatorId || null : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["org-structure"] });
      onCreated();
      setName("");
      setAreaId("");
      setSupervisorId("");
      setCoordinatorId("");
      setError(null);
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "No se pudo crear el equipo");
    },
  });

  const canSubmit =
    name.trim().length > 0 &&
    (user?.role === "coordinator" || areaId.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo equipo</DialogTitle>
          <DialogDescription>
            Crea un equipo de asesores y asígnalo a un supervisor y coordinador.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del equipo</Label>
            <Input
              placeholder="Ej. Equipo Ventas Norte"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {(isAdmin || isAreaManager) && (
            <div className="space-y-2">
              <Label>Área</Label>
              <Select value={areaId} onValueChange={setAreaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un área" />
                </SelectTrigger>
                <SelectContent>
                  {(org?.areas ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Supervisor (lidera el equipo)</Label>
            <Select value={supervisorId} onValueChange={setSupervisorId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin supervisor asignado" />
              </SelectTrigger>
              <SelectContent>
                {supervisorOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.fullName || s.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(isAdmin || isAreaManager) && (
            <div className="space-y-2">
              <Label>Coordinador (responsable del grupo)</Label>
              <Select value={coordinatorId} onValueChange={setCoordinatorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un coordinador" />
                </SelectTrigger>
                <SelectContent>
                  {coordinatorOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName || c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Creando…" : "Crear equipo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Users table ───────────────────────────────────────────────────────────

function RoleCell({
  user,
  canEdit,
  onChange,
}: {
  user: OrgUser;
  canEdit: boolean;
  onChange: (patch: UserUpdatePayload) => void;
}) {
  const me = useAuthStore((s) => s.user);
  const options = me ? ASSIGNABLE_ROLES[me.role] : [];

  if (!canEdit || options.length === 0) {
    return <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>;
  }

  return (
    <Select
      value={user.role}
      onValueChange={(v: UserRole) => onChange({ role: v })}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABELS[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function Users() {
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);

  const { data: users, isLoading, isError, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });
  const { data: org } = useQuery({
    queryKey: ["org-structure"],
    queryFn: getOrgStructure,
  });

  const canEdit =
    me?.role === "admin" ||
    me?.role === "area_manager" ||
    me?.role === "coordinator";

  const myTeams = useMemo(() => {
    if (me?.role !== "coordinator") return null;
    return (org?.teams ?? []).filter((t) => t.coordinatorId === me.sub);
  }, [org, me]);

  const mutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UserUpdatePayload }) =>
      updateUser(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["org-structure"] });
    },
  });

  const handlePatch = (user: OrgUser, patch: UserUpdatePayload) => {
    if (!canEdit || user.id === me?.sub) return;
    mutation.mutate({ id: user.id, patch });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users ?? [];
    return (users ?? []).filter(
      (u) =>
        (u.fullName ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.teamName ?? "").toLowerCase().includes(q),
    );
  }, [users, search]);

  const renderTeamOptions = (user: OrgUser) => {
    const teams = myTeams ?? org?.teams ?? [];
    return (
      <Select
        value={user.teamId ?? "none"}
        onValueChange={(v) =>
          handlePatch(user, { teamId: v === "none" ? null : v })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Sin equipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin equipo</SelectItem>
          {teams.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Asigna roles y organiza equipos: coordinadores → supervisores →
            asesores.
          </p>
        </div>
        <Button onClick={() => setTeamDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo equipo
        </Button>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="structure">Estructura</TabsTrigger>
        </TabsList>

        {/* ── Users tab ────────────────────────────────────────────────── */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar por nombre, correo o equipo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isError && (
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Coordinador</TableHead>
                    <TableHead>Activo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading &&
                    filtered.map((u) => {
                      const isMe = u.id === me?.sub;
                      const editable = canEdit && !isMe;
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {initials(u.fullName, u.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {u.fullName || "—"}
                                  {isMe && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      (tú)
                                    </span>
                                  )}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <RoleCell
                              user={u}
                              canEdit={editable}
                              onChange={(patch) => handlePatch(u, patch)}
                            />
                          </TableCell>
                          <TableCell>
                            {editable ? (
                              renderTeamOptions(u)
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {u.teamName || "—"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {u.supervisorName || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {u.coordinatorName || "—"}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={u.isActive}
                              disabled={!editable}
                              onCheckedChange={(v) =>
                                handlePatch(u, { isActive: v })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No hay usuarios que coincidan con la búsqueda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Structure tab ────────────────────────────────────────────── */}
        <TabsContent value="structure" className="space-y-4">
          {isLoading && <Skeleton className="h-40 w-full" />}
          {!isLoading && org && (
            <div className="grid gap-4 md:grid-cols-2">
              {(org?.areas ?? []).map((area) => {
                const areaTeams = (org?.teams ?? []).filter(
                  (t) => t.areaId === area.id,
                );
                if (areaTeams.length === 0) return null;
                return (
                  <Card key={area.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        {area.name}
                      </CardTitle>
                      <CardDescription>
                        {areaTeams.length}{" "}
                        {areaTeams.length === 1 ? "equipo" : "equipos"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {areaTeams.map((team: OrgTeam) => {
                        const members = (users ?? []).filter(
                          (u) => u.teamId === team.id,
                        );
                        return (
                          <div
                            key={team.id}
                            className="rounded-lg border p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold">
                                {team.name}
                              </p>
                              <Badge variant="outline">
                                {members.length} miembros
                              </Badge>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>
                                <p className="font-medium text-foreground">
                                  Coordinador
                                </p>
                                <p>{team.coordinatorName || "—"}</p>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  Supervisor
                                </p>
                                <p>{team.supervisorName || "—"}</p>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {members.map((m) => (
                                <Badge key={m.id} variant="secondary">
                                  <UsersIcon className="mr-1 h-3 w-3" />
                                  {m.fullName || m.email}
                                </Badge>
                              ))}
                              {members.length === 0 && (
                                <span className="text-xs text-muted-foreground">
                                  Sin asesores asignados
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
              {org?.areas.length === 0 && (
                <p className="col-span-full text-center text-sm text-muted-foreground">
                  No hay áreas ni equipos configurados todavía.
                </p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NewTeamDialog
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
        onCreated={() => setTeamDialogOpen(false)}
      />
    </div>
  );
}
