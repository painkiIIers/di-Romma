import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";

export const menuRouter = Router();
export const adminMenuRouter = Router();
const itemSchema = z.object({
  name: z.string().trim().min(1).max(120), size: z.string().trim().max(60).nullable().optional(),
  price: z.number().int().nonnegative().nullable(), categoryId: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
  categoryName: z.string().trim().min(1).max(80), categoryOrder: z.number().int().nonnegative().default(0),
  itemOrder: z.number().int().nonnegative().default(0), isAvailable: z.boolean().default(true),
});
const updateSchema = itemSchema.partial().refine((data) => Object.keys(data).length > 0, { message: "Pošaljite bar jedno polje za izmenu." });

menuRouter.get("/", async (_req, res) => {
  const items = await prisma.menuItem.findMany({ where: { isAvailable: true }, orderBy: [{ categoryOrder: "asc" }, { itemOrder: "asc" }, { name: "asc" }] });
  const grouped = new Map<string, { id: string; name: string; items: Array<{ id: string; name: string; size: string | null; price: number | null }> }>();
  for (const item of items) {
    if (!grouped.has(item.categoryId)) grouped.set(item.categoryId, { id: item.categoryId, name: item.categoryName, items: [] });
    grouped.get(item.categoryId)!.items.push({ id: item.id, name: item.name, size: item.size, price: item.price });
  }
  res.json({ currency: "din", categories: [...grouped.values()] });
});

adminMenuRouter.use(requireAdmin);
adminMenuRouter.get("/", async (_req, res) => res.json({ items: await prisma.menuItem.findMany({ orderBy: [{ categoryOrder: "asc" }, { itemOrder: "asc" }] }) }));
adminMenuRouter.post("/", async (req, res) => { const item = await prisma.menuItem.create({ data: itemSchema.parse(req.body) }); res.status(201).json({ item }); });
adminMenuRouter.patch("/:id", async (req, res) => { const item = await prisma.menuItem.update({ where: { id: req.params.id }, data: updateSchema.parse(req.body) }); res.json({ item }); });
adminMenuRouter.delete("/:id", async (req, res) => { await prisma.menuItem.update({ where: { id: req.params.id }, data: { isAvailable: false } }); res.status(204).send(); });
