import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

type AdminToken = { sub: string; email: string; role: "ADMIN" };

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.admin_session;
  if (!token) return res.status(401).json({ message: "Niste prijavljeni." });
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AdminToken;
    if (!payload.sub || payload.role !== "ADMIN") throw new Error("Invalid token");
    req.admin = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    res.clearCookie("admin_session", { path: "/" });
    return res.status(401).json({ message: "Sesija nije važeća." });
  }
}
