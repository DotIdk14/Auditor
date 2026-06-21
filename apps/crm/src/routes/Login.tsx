"use client";

import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Briefcase, Loader2, AlertCircle } from "lucide-react";

// ─── Component ──────────────────────────────────────────────────────────────

export default function Login() {
  const { login, isAuthenticated, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState("");

  // Clear local error when email changes
  useEffect(() => {
    if (localError) setLocalError("");
  }, [email]);

  // ── Already authenticated → redirect ─────────────────────────────────────
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      setLocalError("Ingresa tu correo electrónico");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setLocalError("Ingresa un correo electrónico válido");
      return;
    }

    setLocalError("");
    await login(trimmed, trimmed);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            CRM UTEL
          </CardTitle>
          <CardDescription>Inicia sesión para continuar</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error display */}
            {(error || localError) && (
              <div
                className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{localError || error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="login-email">Correo electrónico</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                disabled={isLoading}
                required
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión…
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} CRM UTEL. Todos los derechos
            reservados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
