import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export const notFound: RequestHandler = (_req, res) => { res.status(404).json({ message: "Ruta nije pronađena." }); };
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ message: "Neispravni podaci.", errors: error.flatten().fieldErrors }); return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    res.status(404).json({ message: "Proizvod nije pronađen." }); return;
  }
  console.error(error);
  res.status(500).json({ message: "Došlo je do greške na serveru." });
};
