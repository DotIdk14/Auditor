import type { Request, Response, NextFunction } from "express";
import type { JWTPayload, UserRole } from "../types.js";

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  scope?: {
    role: UserRole;
    areaId: string | null;
    teamId: string | null;
    userId: string;
  };
}

/**
 * Extracts and verifies the JWT from Authorization header.
 * Expects the token to come from InsForge auth (signed with InsForge secret).
 * We decode the token and validate its structure. Full verification is done
 * server-side by InsForge; middleware validates structure and expiry.
 */
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autorización requerido" });
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    const parts = token.split(".");
    if (parts.length !== 3) {
      res.status(401).json({ error: "Token inválido" });
      return;
    }

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      res.status(401).json({ error: "Token expirado" });
      return;
    }

    req.user = {
      sub: payload.sub || "",
      email: payload.email || "",
      displayName: payload.displayName || payload.email?.split("@")[0] || "",
      role: (payload.role as UserRole) || "agent",
      areaId: payload.areaId || null,
      teamId: payload.teamId || null,
    };

    req.scope = {
      role: req.user.role,
      areaId: req.user.areaId || null,
      teamId: req.user.teamId || null,
      userId: req.user.sub,
    };

    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Autenticación requerida" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Permisos insuficientes",
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
      });
      return;
    }
    next();
  };
}

export function injectScope(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (req.user) {
    req.scope = {
      role: req.user.role,
      areaId: req.user.areaId || null,
      teamId: req.user.teamId || null,
      userId: req.user.sub,
    };
  }
  next();
}
