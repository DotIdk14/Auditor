"use client";

import type { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/api/types";

interface PermissionGateProps {
  /** Roles that are allowed to see the children */
  allowedRoles: UserRole[];
  /** Content to render when the user has permission */
  children: ReactNode;
  /** Optional fallback when the user lacks permission (default: null) */
  fallback?: ReactNode;
}

/**
 * PermissionGate conditionally renders children based on the current user's role.
 *
 * @example
 * ```tsx
 * <PermissionGate allowedRoles={["admin", "area_manager"]}>
 *   <AdminPanel />
 * </PermissionGate>
 * ```
 */
export default function PermissionGate({
  allowedRoles,
  children,
  fallback = null,
}: PermissionGateProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return fallback;
  }

  const hasPermission = allowedRoles.includes(user.role);

  if (!hasPermission) {
    return fallback;
  }

  return <>{children}</>;
}
