"use client";

import { NavLink } from "react-router-dom";
import {
  Briefcase,
  LayoutDashboard,
  Users,
  Kanban,
  CheckSquare,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import PermissionGate from "@/components/PermissionGate";

interface SidebarProps {
  /** Whether the sidebar is open (used on mobile) */
  open: boolean;
  /** Callback fired when the sidebar should close (mobile overlay) */
  onClose: () => void;
}

// ─── Navigation items ───────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Roles that can see this item — omit for public-to-all-authenticated */
  roles?: Array<"admin" | "area_manager" | "coordinator" | "supervisor" | "agent" | "qa">;
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Contactos", href: "/contacts", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: Kanban },
  { label: "Tareas", href: "/tasks", icon: CheckSquare },
];

const adminNav: NavItem[] = [
  {
    label: "Usuarios",
    href: "/users",
    icon: Shield,
    roles: ["admin", "area_manager"],
  },
];

// ── Nav link helper ─────────────────────────────────────────────────────────

function SidebarNavItem({ item, onClose }: { item: NavItem; onClose: () => void }) {
  return (
    <NavLink
      to={item.href}
      end={item.href === "/"}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground",
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* ── Brand ──────────────────────────────────────────────────────── */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold tracking-tight">CRM UTEL</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ── Navigation ─────────────────────────────────────────────────── */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {mainNav.map((item) => (
            <SidebarNavItem key={item.href} item={item} onClose={onClose} />
          ))}

          {/* Admin section */}
          {adminNav.some((item) => item.roles) && (
            <>
              <Separator className="my-3" />
              <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Administración
              </p>
              <div className="mt-1 space-y-1">
                {adminNav.map((item) =>
                  item.roles ? (
                    <PermissionGate key={item.href} allowedRoles={item.roles}>
                      <SidebarNavItem item={item} onClose={onClose} />
                    </PermissionGate>
                  ) : (
                    <SidebarNavItem key={item.href} item={item} onClose={onClose} />
                  ),
                )}
              </div>
            </>
          )}
        </nav>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="border-t px-6 py-3">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CRM UTEL
          </p>
        </div>
      </aside>
    </>
  );
}
