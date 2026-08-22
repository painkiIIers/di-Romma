import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { config } from "../config";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";

export const authRouter = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false, message: { message: "Previše pokušaja. Pokušajte ponovo za 15 minuta." } });
const credentialsSchema = z.object({ email: z.string().email().transform((v) => v.toLowerCase().trim()), password: z.string().min(8).max(128) });

authRouter.post("/login", loginLimiter, async (req, res) => {
  const credentials = credentialsSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: credentials.email } });
  const valid = user && await bcrypt.compare(credentials.password, user.passwordHash);
  if (!user || !valid) { res.status(401).json({ message: "Pogrešan email ili lozinka." }); return; }
  const token = jwt.sign({ email: user.email, role: user.role }, config.JWT_SECRET, { subject: user.id, expiresIn: "8h" });
  res.cookie("admin_session", token, { httpOnly: true, secure: config.NODE_ENV === "production", sameSite: "strict", maxAge: 8 * 60 * 60 * 1000, path: "/" });
  res.json({ user: { id: user.id, email: user.email, role: user.role } });
});
authRouter.post("/logout", (_req, res) => { res.clearCookie("admin_session", { httpOnly: true, sameSite: "strict", path: "/" }); res.status(204).send(); });
authRouter.get("/me", requireAdmin, (req, res) => res.json({ user: req.admin }));
