"use client";

import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // ── Loading state ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 text-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <p className="text-sm text-muted-foreground">Verificando sesión…</p>
        </div>
      </div>
    );
  }

  // ── Unauthenticated → redirect ─────────────────────────────────────────
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ── Authenticated → render child routes ────────────────────────────────
  return <Outlet />;
}
