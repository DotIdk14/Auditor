import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRY } from "../config.js";
import type { JWTPayload, UserRole } from "../types.js";

export function signToken(payload: Record<string, unknown>): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JWTPayload {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  /** Injected scope based on user role - used by services for filtering */
  scope?: {
    role: UserRole;
    areaId: string | null;
    teamId: string | null;
    userId: string;
  };
}

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

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    // Inject scope for downstream services
    req.scope = {
      role: decoded.role,
      areaId: decoded.areaId || null,
      teamId: decoded.teamId || null,
      userId: decoded.sub,
    };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

/**
 * Middleware factory that restricts access to specific roles.
 * Use: router.get('/contacts', authenticateToken, requireRole('admin', 'area_manager'), handler)
 */
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

/**
 * Middleware that injects area/team scope based on user role.
 * This ensures that even if RLS is bypassed, the backend enforces scoping.
 */
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
