import "dotenv/config";
import { z } from "zod";

export const config = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET mora imati najmanje 32 karaktera"),
}).parse(process.env);
