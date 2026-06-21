import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}: ${err.message}`);
  res.status(500).json({
    error: process.env.NODE_ENV === "production"
      ? "Error interno del servidor"
      : err.message,
    path: req.originalUrl,
  });
}
