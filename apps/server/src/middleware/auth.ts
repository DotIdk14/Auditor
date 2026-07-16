import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRY } from "../config.js";
import type { JWTPayload, UserRole } from "../types.js";

export function signToken(payload: Record<string, unknown>): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET no configurado");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JWTPayload {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET no configurado");
  }
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
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
